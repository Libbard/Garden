(function () {
  'use strict';
  if (window.GardenColoring) return;

  var TOOLS = [
    { id: 'graphite', eng: 'graphite', key: 'g', ar: 'قلمُ رصاص', en: 'Graphite pencil', size: [1.2, 8], def: .3, set: 'graphite', grp: 'sketch' },
    { id: 'pencil', eng: 'pencil', key: 'p', ar: 'قلمٌ خشبيّ', en: 'Colored pencil', size: [1.4, 9], def: .35, set: 'pencil', grp: 'dry' },
    { id: 'crayon', eng: 'crayon', key: 'c', ar: 'لونٌ شمعيّ', en: 'Wax crayon', size: [4, 28], def: .4, set: 'crayon', grp: 'dry' },
    { id: 'pastel', eng: 'pastel', key: 's', ar: 'طباشيرُ باستيل', en: 'Soft pastel', size: [5, 45], def: .4, set: 'pastel', grp: 'dry' },
    { id: 'marker', eng: 'marker', key: 'm', ar: 'فلوماستر', en: 'Marker', size: [4, 38], def: .35, set: 'marker', grp: 'wet' },
    { id: 'wash', eng: 'wash', key: 'w', ar: 'ألوانٌ مائيّة', en: 'Watercolor', size: [6, 90], def: .35, set: 'wash', grp: 'wet' },
    { id: 'oil', eng: 'oil', key: 'o', ar: 'فرشاةُ زيت', en: 'Oil brush', size: [5, 70], def: .4, set: 'oil', grp: 'wet' },
    { id: 'airbrush', eng: 'airbrush', key: 'a', ar: 'بخّاخ', en: 'Airbrush', size: [12, 170], def: .4, set: 'basic', grp: 'wet' },
    { id: 'ink', eng: 'ink', key: 'n', ar: 'قلمُ حبر', en: 'Fineliner', size: [.8, 6], def: .3, set: 'basic', grp: 'line' },
    { id: 'gel', eng: 'gel', key: 'j', ar: 'قلمُ جِل', en: 'Gel pen', size: [1, 8], def: .3, set: 'basic', grp: 'line' },
    { id: 'blend', eng: 'blend', key: 'r', ar: 'ممسحةُ دمج', en: 'Blending stump', size: [6, 60], def: .4, grp: 'fix' },
    { id: 'eraser', eng: 'eraser', key: 'e', ar: 'ممحاة', en: 'Eraser', size: [4, 80], def: .35, grp: 'fix' },
    { id: 'fill', eng: null, key: 'f', ar: 'دلوُ التعبئة', en: 'Fill bucket', def: 0, grp: 'util' },
    { id: 'pick', eng: null, key: 'i', ar: 'قطّارةُ الألوان', en: 'Color dropper', def: 0, grp: 'util' }
  ];
  var BYID = {}; TOOLS.forEach(function (t) { BYID[t.id] = t; });

  var GUIDE = {
    pencil: { i: 'fa-pencil', w: ['لونٌ جافٌّ رفيع يترك أثراً خفيفاً يظهر فيه نسيجُ الورق.', 'A thin, dry color that leaves a light mark showing the paper grain.'],
      p: [['يتراكم', 'Builds up'], ['شبهُ شفّاف', 'Semi-transparent'], ['دقيق', 'Precise']],
      u: ['التفاصيلُ الصغيرة، والتدرّجُ الهادئ، والتلوينُ المتأنّي طبقةً فوق طبقة.', 'Small details, gentle gradients, and patient layer-over-layer coloring.'],
      h: ['اضغطْ خفيفاً أوّلاً ثمّ زِدِ الضغطَ تدريجيّاً؛ كلُّ مرورٍ يُغمق اللون. حرّكه في اتّجاهٍ واحدٍ أو دوائرَ صغيرة.', 'Press lightly first, then gradually harder; each pass darkens the color. Move in one direction or small circles.'],
      t: ['لا تضغطْ بقوّةٍ من البداية: ابدأْ فاتحاً، فالداكنُ يُضاف بسهولةٍ ولا يُزال بسهولة.', 'Don\'t press hard at first: start light — dark is easy to add and hard to remove.'] },
    graphite: { i: 'fa-pencil', w: ['رماديٌّ من الفاتح إلى الأسود — أداةُ الرسم الأولى.', 'Greys from light to black — the first drawing tool.'],
      p: [['درجاتٌ من 2H إلى 8B', 'Grades 2H to 8B'], ['يُمحى بسهولة', 'Erases easily']],
      u: ['التخطيطُ قبل التلوين، والظلال، ورسمُ الأشكال في الدروس.', 'Sketching before coloring, shading, and drawing shapes in lessons.'],
      h: ['اخترِ الدرجةَ من اللوحة: ما فيه الحرف H فاتحٌ صلب، وما فيه الحرف B داكنٌ ليّن. أمِلِ القلمَ لخطٍّ عريضٍ ناعم.', 'Pick a grade from the palette: H is light and hard, B is dark and soft. Tilt the pen for a broad soft line.'],
      t: ['ارسمِ الخطوطَ الأولى خفيفةً جدّاً لتُمحى أو تُغطّى بسهولة.', 'Draw your first lines very lightly so they are easy to erase or cover.'] },
    marker: { i: 'fa-marker', w: ['حبرٌ لامعٌ برأسٍ مشطوف يغطّي بسرعةٍ وبلونٍ مشبع.', 'Bright ink with a chisel tip that covers fast with saturated color.'],
      p: [['مشبع', 'Saturated'], ['يتجمّع عند الحوافّ', 'Pools at edges']],
      u: ['المساحاتُ المتوسّطة والألوانُ الزاهية والرسومُ الكرتونيّة.', 'Medium areas, bright colors, and cartoon-style art.'],
      h: ['لوّنْ بحركاتٍ متّصلةٍ دون توقّف؛ المرورُ الثاني يُغمق اللون.', 'Color with continuous strokes without stopping; a second pass darkens.'],
      t: ['لوّنِ المنطقةَ كلَّها دفعةً واحدةً لتتجنّبَ الخطوطَ المتداخلة.', 'Fill the whole area in one go to avoid overlapping streaks.'] },
    wash: { i: 'fa-droplet', w: ['صبغةٌ شفّافةٌ تنتشر مع الماء وتجفّ بحوافَّ داكنةٍ رقيقة.', 'Transparent pigment that spreads with water and dries with soft dark edges.'],
      p: [['شفّاف', 'Transparent'], ['يمتزج مبلّلاً', 'Blends while wet'], ['يجفّ مع الوقت', 'Dries over time']],
      u: ['السماءُ والماءُ والخلفيّاتُ والانتقالُ الناعم بين لونين.', 'Skies, water, backgrounds, and soft transitions between two colors.'],
      h: ['الشريحةُ الثانية هي كمّيّةُ الماء. ضربةٌ على لونٍ مبلّلٍ تمتزج معه، وعلى لونٍ جافٍّ تضيف طبقة.', 'The second slider is the amount of water. A stroke on wet paint blends; on dry paint it adds a layer.'],
      t: ['ابدأْ بالألوان الفاتحة وانتظرِ الجفافَ قبل الداكنة؛ المائيُّ لا يغطّي ما تحته.', 'Start with light colors and let them dry before dark ones; watercolor doesn\'t cover what\'s under it.'] },
    crayon: { i: 'fa-pencil', w: ['شمعٌ ملوّنٌ خشنٌ يترك فراغاتٍ بيضاءَ في حبيبات الورق.', 'Rough colored wax that leaves white specks in the paper grain.'],
      p: [['ملمسٌ يدويّ', 'Hand-made texture'], ['دافئ', 'Warm']],
      u: ['رسومُ الأطفال والمساحاتُ الكبيرة بطابعٍ دافئ.', 'Children\'s drawings and large areas with a warm feel.'],
      h: ['الضغطُ الخفيف يُظهر الملمس، والقويُّ يملأ الفراغات.', 'Light pressure shows the texture; heavy pressure fills the gaps.'],
      t: ['جرّبْ ورقاً خشناً من الإعدادات ليظهرَ الملمسُ أجمل.', 'Try a rough paper in the settings to make the texture shine.'] },
    pastel: { i: 'fa-paintbrush', w: ['مسحوقُ لونٍ ناعمٌ معتمٌ يغطّي ويمتزج بسهولة.', 'Soft, opaque powdered color that covers and blends easily.'],
      p: [['معتم', 'Opaque'], ['يمتزج', 'Blends']],
      u: ['الغيومُ والبشرةُ والسماءُ والانتقالاتُ الناعمة.', 'Clouds, skin, skies, and soft transitions.'],
      h: ['لوّنْ ثمّ مرّرْ «ممسحةَ الدمج» على الحدّ بين اللونين.', 'Color, then run the blending stump over the border between colors.'],
      t: ['الباستيلُ الفاتحُ يغطّي الداكن، فتستطيع إضافةَ الإضاءة في النهاية.', 'Light pastel covers dark, so you can add highlights at the end.'] },
    oil: { i: 'fa-paintbrush', w: ['لونٌ كثيفٌ معتمٌ يحمل أثرَ شعر الفرشاة ويقلّ مع طول الضربة.', 'Thick, opaque paint that shows the bristles and runs out along the stroke.'],
      p: [['كثيف', 'Thick'], ['معتم', 'Opaque'], ['أثرُ الفرشاة', 'Brush marks']],
      u: ['اللوحاتُ الغنيّة والمساحاتُ العريضة والتعبيرُ بالضربات.', 'Rich paintings, broad areas, and expressive strokes.'],
      h: ['الضربةُ الطويلة تُفرغ الفرشاة؛ ارفعِ القلمَ وابدأْ ضربةً جديدةً لتعيدَ تحميلها.', 'Long strokes empty the brush; lift and start a new stroke to reload it.'],
      t: ['اتّبعْ شكلَ الجسم بضرباتك: مستديرةٌ للتفّاحة، وطويلةٌ للعشب.', 'Follow the shape with your strokes: round for an apple, long for grass.'] },
    airbrush: { i: 'fa-spray-can', w: ['رذاذٌ ناعمٌ بلا حوافّ يتراكم كلّما بقيتَ في مكانك.', 'A soft, edgeless spray that builds up the longer you stay.'],
      p: [['ناعم', 'Soft'], ['يتراكم بالتوقّف', 'Builds while still']],
      u: ['الظلالُ الناعمة والتوهّجُ والتدرّجاتُ الواسعة.', 'Soft shadows, glows, and wide gradients.'],
      h: ['كلّما توقّفتَ ازداد اللون؛ حرّكْ يدك بسرعةٍ لطبقةٍ خفيفة.', 'Pause to deepen the color; move quickly for a light layer.'],
      t: ['استعمله مع «داخل الخطوط» ليبقى الرذاذُ داخل الشكل.', 'Use it with "Inside the lines" to keep the spray in the shape.'] },
    ink: { i: 'fa-pen-nib', w: ['خطٌّ دقيقٌ ثابتُ العرض.', 'A fine line with steady width.'],
      p: [['دقيق', 'Fine'], ['ثابت', 'Steady']],
      u: ['تحبيرُ الخطوط والتفاصيلُ الدقيقة والكتابة.', 'Inking lines, fine details, and lettering.'],
      h: ['الحركةُ الواثقة تعطي خطّاً أنظف من الحركة البطيئة.', 'A confident movement gives a cleaner line than a slow one.'],
      t: ['ارسمْ خطوطاً قصيرةً متتابعةً بدل خطٍّ طويلٍ مرتجف.', 'Draw short connected lines instead of one long shaky line.'] },
    gel: { i: 'fa-pen', w: ['حبرٌ معتمٌ لامعٌ يظهر حتّى فوق الألوان الداكنة.', 'Opaque, glossy ink that shows even on dark colors.'],
      p: [['معتم', 'Opaque'], ['لامع', 'Glossy']],
      u: ['اللمعاتُ البيضاء والنقاطُ الزخرفيّة واللمساتُ الأخيرة.', 'White highlights, decorative dots, and finishing touches.'],
      h: ['اخترِ الأبيضَ وضعْ نقطةً صغيرةً في العين أو على سطحٍ لامع.', 'Pick white and add a small dot in an eye or on a shiny surface.'],
      t: ['لمعةٌ صغيرةٌ واحدة تجعل الرسمةَ حيّة — لا تُكثرْ منها.', 'One small highlight brings a drawing to life — don\'t overdo it.'] },
    blend: { i: 'fa-hand', w: ['أداةٌ بلا لونٍ تسحب الألوانَ الموجودة وتمزجها.', 'A colorless tool that pulls existing colors and mixes them.'],
      p: [['بلا لون', 'No color'], ['ينعّم', 'Softens']],
      u: ['تنعيمُ الانتقال بين لونين وتليينُ الظلال.', 'Smoothing the transition between colors and softening shadows.'],
      h: ['مرّرها على الحدّ بين اللونين بحركاتٍ صغيرة.', 'Run it over the border between two colors with small motions.'],
      t: ['تعمل أفضلَ مع الباستيل والرصاص والخشبيّ.', 'Works best with pastel, graphite, and colored pencil.'] },
    eraser: { i: 'fa-eraser', w: ['تُزيل اللونَ وتعيد الورقَ أبيض، ولا تمسّ خطوطَ الرسمة.', 'Removes color back to white paper, without touching the drawing\'s lines.'],
      p: [['لا تمسّ الخطوط', 'Keeps the lines'], ['الاختصار E', 'Shortcut E']],
      u: ['تصحيحُ الأخطاء، وصنعُ إضاءةٍ بإزالة جزءٍ من اللون.', 'Fixing mistakes, and making highlights by lifting some color.'],
      h: ['الحجمُ من الشريحة. مع «داخل الخطوط» تمحو داخل الشكل وحدَه. وزرُّ القلم الجانبيّ يمحو أيضاً.', 'Set the size with the slider. With "Inside the lines" it erases only inside the shape. Your pen\'s side button erases too.'],
      t: ['امحُ بخفّةٍ لتفتيح اللون بدل إزالته كلِّه.', 'Erase lightly to lighten a color instead of removing it all.'] },
    fill: { i: 'fa-fill-drip', w: ['يملأ الشكلَ المغلقَ كلَّه بضغطةٍ واحدة، بخامة أداتك الحاليّة.', 'Fills a whole closed shape in one tap, with your current tool\'s texture.'],
      p: [['سريع', 'Fast'], ['بخامة الأداة', 'Tool texture']],
      u: ['البدءُ السريع بالألوان الأساسيّة قبل التفاصيل.', 'A quick start with base colors before details.'],
      h: ['اخترْ أداةً (خشبيّ أو مائيّ…) ثمّ الدلوَ ثمّ اضغطْ داخل الشكل. و«تظليل» يضيف ضوءاً وظلّاً.', 'Pick a tool (pencil, watercolor…), then the bucket, then tap inside a shape. "Shading" adds light and shadow.'],
      t: ['املأِ الأساسَ بالدلو ثمّ أضفِ الظلالَ بيدك لنتيجةٍ احترافيّة.', 'Fill the base with the bucket, then add shadows by hand for a pro result.'] },
    pick: { i: 'fa-eye-dropper', w: ['تأخذ اللونَ من أيّ نقطةٍ في الرسمة.', 'Takes the color from any point of the drawing.'],
      p: [['الاختصار I', 'Shortcut I']],
      u: ['إعادةُ استعمال لونٍ وضعتَه سابقاً.', 'Reusing a color you already placed.'],
      h: ['اضغطْ على النقطة فيصير لونُها لونَك الحاليّ.', 'Tap a point and its color becomes your current color.'],
      t: ['مع «الأصل» ظاهراً تأخذ ألوانَ الصورة الأصليّة مباشرةً.', 'With "Original" shown, you pick colors straight from the original.'] }
  };

  var GROUPS = { sketch: ['التخطيط', 'Sketch'], dry: ['تلوينٌ جافّ', 'Dry color'], wet: ['تلوينٌ رطب', 'Wet color'], line: ['تحبيرٌ ولمسات', 'Ink & accents'], fix: ['تنعيمٌ وتصحيح', 'Blend & fix'], util: ['أدوات', 'Tools'] };
  var MORE = {
    graphite: { k: ['للخطوط الأولى والظلال الدقيقة', 'First lines and fine shading'], g: ['أمِلِ القلمَ لظلٍّ عريضٍ ناعم، وقِفْه عموديّاً لخطٍّ حادّ. الضغطُ الخفيف يُبقي الخطَّ قابلاً للمحو.', 'Tilt for a broad soft shade; hold upright for a crisp line. A light touch keeps lines easy to erase.'],
      x: ['الضغطُ القويُّ من البداية يحفر خطّاً داكناً يصعب إخفاؤه تحت الألوان.', 'Pressing hard from the start leaves a dark line that is hard to hide under color.'], m: ['الممحاة والممسحة', 'Eraser and blending stump'] },
    pencil: { k: ['دقيق — طبقاتٌ متأنّية', 'Precise — patient layers'], g: ['الضغطُ يقرّر الكثافة: خفيفٌ = شفّاف، قويٌّ = مشبع. والإمالةُ تعرض الرأسَ لتظليلٍ أسرع.', 'Pressure sets density: light = sheer, firm = rich. Tilt widens the tip for faster shading.'],
      x: ['لونٌ واحدٌ مضغوطٌ بقوّة يبدو مسطّحاً — ركّبْ لونين أو ثلاثة طبقةً فوق طبقة.', 'One color pressed hard looks flat — layer two or three colors instead.'], m: ['ممسحة الدمج والجِل الأبيض', 'Blending stump and white gel'] },
    crayon: { k: ['سريع — مساحاتٌ كبيرة', 'Fast — large areas'], g: ['الإمالةُ تعطي أثراً عريضاً خشناً، والرأسُ للحوافّ.', 'Tilt for a wide rough mark; use the tip for edges.'],
      x: ['المرورُ مرّاتٍ كثيرة يملأ الحبيبات فيضيع الملمس الجميل.', 'Too many passes fill the grain and lose the lovely texture.'], m: ['ورقٌ مائيٌّ خشن', 'Rough watercolor paper'] },
    pastel: { k: ['سريعٌ وناعم — انتقالاتٌ ومساحات', 'Fast and soft — gradients and areas'], g: ['ضغطٌ متوسّط ثمّ ادمجْ. الإمالةُ تغطّي مساحةً أوسع.', 'Medium pressure, then blend. Tilt to cover more.'],
      x: ['الدمجُ قبل وضع اللونين معاً يعطي لوناً باهتاً.', 'Blending before both colors are down gives a dull result.'], m: ['ممسحة الدمج', 'Blending stump'] },
    marker: { k: ['سريع — ألوانٌ زاهية', 'Fast — bright colors'], g: ['الرأسُ مشطوف: عريضٌ بزاويةٍ ورفيعٌ بأخرى. الضغطُ لا يغيّر العرض بل تدفّقَ الحبر.', 'Chisel tip: broad one way, thin the other. Pressure changes ink flow, not width.'],
      x: ['التوقّفُ في منتصف المساحة يترك بقعةً داكنة عند الحدّ.', 'Stopping mid-area leaves a dark pool at the edge.'], m: ['قلمُ حبرٍ للخطوط فوقه', 'A fineliner on top for lines'] },
    wash: { k: ['سريع — سماءٌ وخلفيّات', 'Fast — skies and backgrounds'], g: ['الشريحةُ الثانية كمّيّةُ الماء. ضربةٌ على المبلول تمتزج، وعلى الجافّ تضيف طبقة.', 'The second slider is water. On wet paint it blends; on dry paint it layers.'],
      x: ['العملُ على المنطقة نفسِها وهي تجفّ يترك بقعاً — انتظرْ حتى تجفّ تماماً.', 'Working an area while it dries leaves blooms — wait until fully dry.'], m: ['قلمُ رصاصٍ تحته وحبرٌ فوقه', 'Graphite under, ink on top'] },
    oil: { k: ['تعبيريّ — ضرباتٌ عريضة', 'Expressive — broad strokes'], g: ['ضرباتٌ قصيرةٌ واثقة تُبرز أثرَ الشعر. ارفعِ القلم لتعيدَ تحميل الفرشاة.', 'Short confident strokes show the bristles. Lift to reload the brush.'],
      x: ['الضربةُ الطويلةُ جدّاً تفرغ الفرشاةَ فيصير آخرُها باهتاً.', 'A very long stroke empties the brush and fades out.'], m: ['ورقُ القماش', 'Canvas paper'] },
    airbrush: { k: ['سريعٌ وناعم — ظلٌّ وتوهّج', 'Fast and soft — shadows and glow'], g: ['ابقَ فوق المكان ليزداد اللون، وحرّكْ يدك بسرعةٍ لطبقةٍ خفيفة.', 'Hover to build color; move quickly for a light veil.'],
      x: ['الرشُّ الكثيفُ مرّةً واحدة يغطّي التفاصيل — ابنِه تدريجيّاً.', 'Heavy spraying at once hides details — build it gradually.'], m: ['«داخل الخطوط» ليبقى داخل الشكل', '“Inside lines” to keep it in the shape'] },
    ink: { k: ['دقيق — خطوطٌ وتفاصيل', 'Precise — lines and details'], g: ['العرضُ يتغيّر قليلاً بالضغط. كبّرِ الرسمةَ للتفاصيل الصغيرة.', 'Width changes a little with pressure. Zoom in for small details.'],
      x: ['التحبيرُ قبل جفاف المائيّ يُسيل الخطّ.', 'Inking before watercolor dries makes the line bleed.'], m: ['المائيّ والفلوماستر تحته', 'Watercolor or marker underneath'] },
    gel: { k: ['دقيق — لمساتٌ أخيرة', 'Precise — finishing touches'], g: ['نقرةٌ صغيرةٌ تكفي للمعة. يغطّي حتّى الألوانَ الداكنة.', 'A tiny tap is enough for a highlight. It covers even dark colors.'],
      x: ['اللمعاتُ الكثيرة تُفقد الرسمةَ عمقَها.', 'Too many highlights flatten the drawing.'], m: ['كلُّ الأدوات — يأتي في النهاية', 'Every tool — it comes last'] },
    blend: { k: ['تنعيمٌ دقيق', 'Precise softening'], g: ['حركاتٌ دائريّةٌ صغيرة على الحدّ. الضغطُ الأقوى يسحب لوناً أكثر.', 'Small circles on the border. Firmer pressure drags more color.'],
      x: ['الدمجُ فوق الرسمة كلِّها يمحو الملمسَ والحدود.', 'Blending everything erases texture and edges.'], m: ['الباستيل والخشبيّ والرصاص', 'Pastel, colored pencil, graphite'] },
    eraser: { k: ['للتصحيح والإضاءة', 'Fixes and highlights'], g: ['المحوُ الخفيف يفتّح ولا يزيل. وزرُّ القلم الجانبيّ يمحو بلا تبديل الأداة.', 'Light erasing lightens without removing. Your pen’s side button erases without switching.'],
      x: ['ممحاةٌ كبيرةٌ قرب التفاصيل تمسح ما حولها.', 'A big eraser near details wipes their surroundings.'], m: ['الرصاص والخشبيّ', 'Graphite and colored pencil'] },
    fill: { k: ['الأسرعُ — بدايةٌ في ثوانٍ', 'Fastest — a start in seconds'], g: ['اضغطْ داخل شكلٍ مغلق. الخامةُ من أداتك الحاليّة، و«تظليل» يضيف ضوءاً وظلّاً.', 'Tap inside a closed shape. The texture comes from your current tool; “Shading” adds light and shade.'],
      x: ['شكلٌ غيرُ مغلقٍ يُملأ معه ما حوله — أغلقِ الفجوةَ بالحبر أوّلاً.', 'An open shape spills — close the gap with ink first.'], m: ['الخشبيّ والباستيل للظلال بعده', 'Pencil or pastel for shading after'] },
    pick: { k: ['لإعادة لونٍ بدقّة', 'Reuse a color exactly'], g: ['اضغطْ على النقطة. ومع «الأصل» ظاهراً تأخذ ألوانَ الصورة الأصليّة.', 'Tap a point. With “Original” shown you take the original colors.'],
      x: ['أخذُ لونٍ من حافّة الخطّ يعطي لوناً مختلطاً بالأسود.', 'Picking at a line edge gives a color mixed with black.'], m: ['«الأصل» (V)', '“Original” (V)'] }
  };
  var BOOK = [
    ['fa-flag-checkered', ['ابدأْ من هنا: خمسُ خطوات', 'Start here: five steps'], [
      ['انظرْ إلى «الأصل» (V) لتعرف الألوانَ وأين الضوءُ والظلّ.', 'Look at the “Original” (V) to see the colors and where light and shadow fall.'],
      ['املأِ الأساس: «لوّنْها تلقائيّاً» أو الدلو (F) — أو الخشبيُّ والباستيل بخفّة.', 'Lay the base: “Auto-color” or the bucket (F) — or light pencil and pastel.'],
      ['ظلّلْ من الفاتح إلى الداكن طبقةً فوق طبقة؛ الداكنُ يُضاف بسهولةٍ ولا يُزال بسهولة.', 'Shade light to dark, layer over layer; dark is easy to add and hard to remove.'],
      ['نعّمِ الحدودَ بممسحة الدمج (R) حيث تريد انتقالاً ناعماً.', 'Soften borders with the blending stump (R) where you want a smooth transition.'],
      ['اختمْ بلمساتٍ: حبرٌ (N) للخطوط، وجِلٌ أبيض (J) لِلَمعةٍ أو اثنتين.', 'Finish: ink (N) for lines and white gel (J) for one or two highlights.']]],
    ['fa-gauge-high', ['سريعٌ أم دقيق؟', 'Fast or precise?'], [
      ['للسرعة: «لوّنْها» · الدلو · فلوماستر عريض · مائيٌّ بفرشاةٍ كبيرة · بخّاخ · شمعيّ.', 'Fast: Auto-color · bucket · broad marker · big watercolor brush · airbrush · crayon.'],
      ['للدقّة: رصاص · خشبيّ · حبر · جِل — كبّرِ الرسمة (+ أو Ctrl مع العجلة) وصغّرِ الرأس ( [ ).', 'Precise: graphite · pencil · ink · gel — zoom in (+ or Ctrl+wheel) and shrink the tip ( [ ).'],
      ['«داخل الخطوط» (L) يمنع اللونَ من تجاوز الشكل الذي بدأتَ فيه — اتركه مفعّلاً وأنت تتعلّم.', '“Inside lines” (L) keeps color in the shape you started in — keep it on while learning.']]],
    ['fa-pen-nib', ['القلمُ واللمس', 'Pen and touch'], [
      ['الضغطُ يغيّر الكثافةَ والعرض، والإمالةُ تعرض رأسَ الرصاص والخشبيّ والباستيل والشمعيّ.', 'Pressure changes density and width; tilt widens graphite, pencil, pastel and crayon.'],
      ['زرُّ القلم الجانبيّ ممحاةٌ فوريّة. وتغيّره من إعدادات القلم في الملاحظات.', 'The pen’s side button is an instant eraser; change it in the notes pen settings.'],
      ['إصبعان: تكبيرٌ وتحريك · نقرةٌ بإصبعين: تراجع · بثلاثة: إعادة · المسافة (Space) مع السحب: تحريك.', 'Two fingers: zoom and move · two-finger tap: undo · three: redo · Space + drag: move.']]],
    ['fa-palette', ['الألوان', 'Colors'], [
      ['«من الرسمة»: ألوانُ الأصل مرتّبةً بدرجاتها — أسرعُ طريقٍ لنتيجةٍ متناسقة.', '“From the drawing”: the original’s colors in their shades — the quickest way to harmony.'],
      ['الشريطُ العلويّ درجاتُ لونك الحاليّ من الفاتح إلى الداكن: الفاتحُ للضوء والداكنُ للظلّ.', 'The top strip shows your color from light to dark: light for light, dark for shadow.'],
      ['القطّارة (I) تأخذ لوناً من الرسمة، وX يبدّل بين آخر لونين.', 'The dropper (I) takes a color; X swaps your last two colors.']]],
    ['fa-layer-group', ['الورقُ والجودة', 'Paper and quality'], [
      ['ناعم: للفلوماستر والحبر · ورقُ رسم: للأقلام · مائيّ: للمائيّ والشمعيّ · قماش: للزيت.', 'Smooth: marker and ink · Drawing: pencils · Watercolor: watercolor and crayon · Canvas: oil.'],
      ['الرسمةُ نفسُها بالجودة نفسِها على كلِّ جهاز؛ الجهازُ الأضعف يعرض المؤثّراتِ أخفَّ وهو يرسم فقط.', 'Your drawing is the same full quality on every device; a weaker device only previews effects more lightly.']]],
    ['fa-floppy-disk', ['احفظْ عملك', 'Keep your work'], [
      ['«أدرجْ في الصفحة» يضع الرسمةَ في ملاحظتك، و«أكملِ التلوين» يعيدك إليها بكلِّ تفاصيلها وتراجعها.', '“Insert” puts it in your note; “Keep coloring” brings you back with every detail and undo step.'],
      ['«ملفّ ← احفظْها في رسوماتي» تحفظها في حسابك وحدَها، وتجدها على كلِّ أجهزتك.', '“File → Save to My drawings” keeps it in your account on its own, on all your devices.'],
      ['«ملفّ ← صدّرْ ملفَّ المرسم» نسخةٌ كاملةٌ تفتحها لاحقاً من «ملفّ ← افتحْ».', '“File → Export studio file” is a full copy you can reopen later from “File → Open”.']]],
    ['fa-keyboard', ['اختصارات', 'Shortcuts'], [
      ['G رصاص · P خشبيّ · C شمعيّ · S باستيل · M فلوماستر · W مائيّ · O زيت · A بخّاخ · N حبر · J جِل · R دمج · E ممحاة · F دلو · I قطّارة', 'G graphite · P pencil · C crayon · S pastel · M marker · W watercolor · O oil · A airbrush · N ink · J gel · R blend · E eraser · F bucket · I dropper'],
      ['[ ] حجمُ الرأس · + − 0 1 التكبير · H اليد · V الأصل · L داخل الخطوط · X تبديلُ اللون · Ctrl+Z تراجع · Ctrl+Y إعادة', '[ ] tip size · + − 0 1 zoom · H hand · V original · L inside lines · X swap color · Ctrl+Z undo · Ctrl+Y redo']]]
  ];

  var SETS = {
    pencil: { ar: 'علبةُ الخشبيّة', en: 'Pencil tin', c: [
      ['#fff36b', 'أصفرُ فاتح', 'Canary'], ['#ffd21f', 'أصفر', 'Yellow'], ['#ffad1f', 'ذهبيّ', 'Golden'], ['#ff7a1a', 'برتقاليّ', 'Orange'],
      ['#ff4b3e', 'أحمرُ فاتح', 'Scarlet'], ['#d81f2a', 'أحمر', 'Red'], ['#9e1b32', 'خمريّ', 'Wine'], ['#ff8fb1', 'ورديّ', 'Pink'],
      ['#e0457b', 'فوشيا', 'Fuchsia'], ['#b04fc4', 'أرجوانيّ', 'Purple'], ['#7448c2', 'بنفسجيّ', 'Violet'], ['#3f3fa8', 'نيليّ', 'Indigo'],
      ['#2563eb', 'أزرق', 'Blue'], ['#38a3f1', 'سماويّ', 'Sky'], ['#7dd3fc', 'أزرقُ ثلجيّ', 'Ice blue'], ['#14b8a6', 'فيروزيّ', 'Teal'],
      ['#0f766e', 'أخضرُ بحريّ', 'Sea green'], ['#16a34a', 'أخضر', 'Green'], ['#4d7c0f', 'زيتيّ', 'Olive'], ['#84cc16', 'ليمونيّ', 'Lime'],
      ['#bef264', 'أخضرُ فاتح', 'Spring'], ['#a16207', 'خردليّ', 'Mustard'], ['#c2793d', 'بنّيٌّ فاتح', 'Tan'], ['#8b5a2b', 'بنّيّ', 'Brown'],
      ['#5c3a1e', 'بنّيٌّ داكن', 'Dark brown'], ['#f8c9a8', 'لونُ البشرة', 'Peach'], ['#e9a77a', 'برونزيّ', 'Bronze'], ['#c68642', 'قمحيّ', 'Caramel'],
      ['#8d5524', 'كاكاو', 'Cocoa'], ['#e5e7eb', 'رماديٌّ فاتح', 'Light grey'], ['#9ca3af', 'رماديّ', 'Grey'], ['#4b5563', 'رماديٌّ داكن', 'Dark grey'],
      ['#111111', 'أسود', 'Black'], ['#ffffff', 'أبيض', 'White'], ['#d4af37', 'ذهب', 'Gold'], ['#a8a9ad', 'فضّة', 'Silver']] },
    wash: { ar: 'علبةُ المائيّ', en: 'Watercolor pans', c: [
      ['#f7d23e', 'أصفرُ ليمونيّ', 'Lemon yellow'], ['#f4a91c', 'أصفرُ كادميوم', 'Cadmium yellow'], ['#f0812a', 'برتقاليّ', 'Orange'], ['#e2452c', 'قرمزيّ', 'Vermilion'],
      ['#c21e3a', 'أحمرُ داكن', 'Crimson'], ['#e66a8e', 'ورديّ', 'Rose'], ['#b23a88', 'أرجوانيّ', 'Magenta'], ['#6c3fa0', 'بنفسجيّ', 'Violet'],
      ['#2e4fa8', 'لازورديّ', 'Ultramarine'], ['#2a8bc9', 'أزرقُ سماويّ', 'Cerulean'], ['#1ba3a6', 'فيروزيّ', 'Turquoise'], ['#1f7a5a', 'أخضرُ زمرّديّ', 'Viridian'],
      ['#6b9b2e', 'أخضرُ عشبيّ', 'Sap green'], ['#a8c64a', 'أخضرُ فاتح', 'Light green'], ['#c9962e', 'مغرةٌ صفراء', 'Yellow ochre'], ['#b9763a', 'سيينا خام', 'Raw sienna'],
      ['#9a4a2a', 'سيينا محروقة', 'Burnt sienna'], ['#6b4126', 'بنّيّ داكن', 'Burnt umber'], ['#f5b7a0', 'خوخيّ', 'Peach'], ['#9ccbeb', 'أزرقُ فاتح', 'Sky blue'],
      ['#c3a6de', 'ليلكيّ', 'Lilac'], ['#4c5866', 'رماديّ باين', "Payne's grey"], ['#8a8f96', 'رماديّ', 'Grey'], ['#2b2b30', 'أسود', 'Ivory black']] },
    marker: { ar: 'علبةُ الفلوماستر', en: 'Marker set', c: [
      ['#ffe45c', 'أصفر', 'Yellow'], ['#ffb020', 'كهرمانيّ', 'Amber'], ['#ff7a3d', 'برتقاليّ', 'Orange'], ['#f2445a', 'أحمر', 'Red'],
      ['#e0457b', 'ورديّ', 'Pink'], ['#c44fd0', 'أرجوانيّ', 'Purple'], ['#7a5cff', 'بنفسجيّ', 'Violet'], ['#3b6cf6', 'أزرق', 'Blue'],
      ['#2aa1d9', 'سماويّ', 'Sky'], ['#1fbfa4', 'نعناعيّ', 'Mint'], ['#27a148', 'أخضر', 'Green'], ['#9ccc2c', 'ليمونيّ', 'Lime'],
      ['#b07a4a', 'بنّيّ', 'Brown'], ['#f4c7a4', 'بشرة', 'Skin'], ['#c9ccd3', 'رماديٌّ بارد', 'Cool grey'], ['#5a5f69', 'رماديٌّ داكن', 'Dark grey'], ['#151517', 'أسود', 'Black']] },
    oil: { ar: 'أنابيبُ الزيت', en: 'Oil tubes', c: [
      ['#f4f1e8', 'أبيضُ التيتانيوم', 'Titanium white'], ['#f6d32d', 'أصفرُ الكادميوم', 'Cadmium yellow'], ['#e8a33a', 'مغرةٌ صفراء', 'Yellow ochre'],
      ['#e2452c', 'أحمرُ الكادميوم', 'Cadmium red'], ['#9e1b32', 'أليزارين قرمزيّ', 'Alizarin crimson'], ['#8a4a2a', 'سيينا محروقة', 'Burnt sienna'],
      ['#5c3a1e', 'أمبر محروق', 'Burnt umber'], ['#1d3fa8', 'أزرقُ الألترامارين', 'Ultramarine blue'], ['#0f5a8a', 'أزرقُ بروسيا', 'Prussian blue'],
      ['#2a8bc9', 'أزرقُ سيرولين', 'Cerulean blue'], ['#1f7a5a', 'أخضرُ فيريديان', 'Viridian'], ['#6b8e23', 'أخضرُ عشبيّ', 'Sap green'],
      ['#6c3fa0', 'بنفسجيُّ ديوكسازين', 'Dioxazine violet'], ['#d98aa8', 'ورديٌّ فاتح', 'Rose'], ['#1d1d1f', 'أسودُ العاج', 'Ivory black']] },
    pastel: { ar: 'علبةُ الباستيل', en: 'Pastel box', c: [
      ['#fff4c2', 'كريميّ', 'Cream'], ['#ffd34d', 'أصفرُ ذهبيّ', 'Golden yellow'], ['#ff9f6e', 'خوخيّ', 'Peach'], ['#e04a7a', 'ورديٌّ داكن', 'Deep rose'],
      ['#c23b3b', 'أحمر', 'Red'], ['#9b6bd6', 'بنفسجيّ', 'Violet'], ['#5aa0e6', 'أزرقُ سماويّ', 'Sky blue'], ['#2e5c9e', 'أزرقُ ليليّ', 'Night blue'],
      ['#7ccf8b', 'أخضرُ نعناعيّ', 'Mint'], ['#3f8a4a', 'أخضرُ ورقيّ', 'Leaf green'], ['#c7a27a', 'رمليّ', 'Sand'], ['#7a5a43', 'بنّيّ', 'Brown'],
      ['#ffffff', 'أبيض', 'White'], ['#9a9aa0', 'رماديّ', 'Grey'], ['#222226', 'فحميّ', 'Charcoal']] },
    crayon: { ar: 'علبةُ الشمعيّ', en: 'Crayon box', c: [
      ['#ffe14d', 'أصفر', 'Yellow'], ['#ff9f1c', 'برتقاليّ', 'Orange'], ['#ff3b30', 'أحمر', 'Red'], ['#ff6fae', 'ورديّ', 'Pink'],
      ['#a259ff', 'بنفسجيّ', 'Purple'], ['#2f6bff', 'أزرق', 'Blue'], ['#33c3f0', 'سماويّ', 'Sky'], ['#20c997', 'نعناعيّ', 'Mint'],
      ['#2fb344', 'أخضر', 'Green'], ['#8a5a2b', 'بنّيّ', 'Brown'], ['#f2c6a0', 'خوخيّ', 'Peach'], ['#9aa0a6', 'رماديّ', 'Grey'],
      ['#1d1d1f', 'أسود', 'Black'], ['#ffffff', 'أبيض', 'White'], ['#e0b100', 'ذهبيّ', 'Gold'], ['#7b3f00', 'شوكولاتة', 'Chocolate']] }
  };
  var GRADES = [['2H', .34], ['HB', .5], ['2B', .62], ['4B', .74], ['6B', .84], ['8B', .93]];
  var FAMILIES = [
    ['red', 'أحمر', 'Red', 27, 1], ['orange', 'برتقاليّ', 'Orange', 55, 1], ['yellow', 'أصفر', 'Yellow', 95, 1], ['lime', 'ليمونيّ', 'Lime', 125, 1],
    ['green', 'أخضر', 'Green', 148, 1], ['teal', 'فيروزيّ', 'Teal', 185, 1], ['cyan', 'سماويّ', 'Cyan', 220, 1], ['blue', 'أزرق', 'Blue', 258, 1],
    ['indigo', 'نيليّ', 'Indigo', 278, 1], ['violet', 'بنفسجيّ', 'Violet', 302, 1], ['magenta', 'أرجوانيّ', 'Magenta', 330, 1], ['pink', 'ورديّ', 'Pink', 2, .8],
    ['skin', 'بشرة', 'Skin', 60, .32], ['brown', 'بنّيّ', 'Brown', 50, .45], ['olive', 'زيتيّ', 'Olive', 110, .42], ['grey', 'رماديّ', 'Grey', 250, .03]
  ];
  var LIGHTS = [.95, .87, .78, .69, .6, .51, .42, .33, .24];
  var PALMS = [['auto', 'تلقائيّ', 'Automatic'], ['never', 'الإصبعُ يرسم', 'Finger draws'], ['always', 'ارفضِ اللمس', 'Reject touch']];
  var TIERS = { high: { doc: 2048, cap: 2.5 }, mid: { doc: 2048, cap: 1.5 }, low: { doc: 2048, cap: 1 } };
  var PERF_KEY = 'garden_mirsam_perf', QUALS = [['auto', 'تلقائيّة', 'Auto'], ['high', 'عالية', 'High'], ['mid', 'متوسّطة', 'Medium'], ['low', 'خفيفة', 'Light']];
  function perfKey() { var d = window.devicePixelRatio || 1; return [Math.round(screen.width * d), Math.round(screen.height * d), d].join('x'); }
  var SOFT_GPU = /swiftshader|llvmpipe|softpipe|basic render|software|microsoft basic/i;
  function autoTier() {
    var c = store(PERF_KEY);
    if (c && c.v === 5 && c.key === perfKey() && TIERS[c.tier]) return c;
    var g = window.GardenPaintGL && GardenPaintGL.gpu ? GardenPaintGL.gpu() : '', d = Math.min(2.5, window.devicePixelRatio || 1), mem = navigator.deviceMemory || 8;
    var tier = SOFT_GPU.test(g) ? 'low' : mem <= 2 ? 'mid' : 'high';
    c = { v: 5, key: perfKey(), tier: tier, cap: Math.min(TIERS[tier].cap, d), gpu: g, at: Date.now() };
    store(PERF_KEY, c);
    return c;
  }
  function stepDown(c) {
    var o = ['high', 'mid', 'low'], i = o.indexOf(c.tier);
    if (c.cap > 1) c.cap = Math.max(1, c.cap - .5);
    else if (i < 2) { c.tier = o[i + 1]; c.cap = Math.min(c.cap, TIERS[c.tier].cap); }
    else return false;
    c.down = (c.down || 0) + 1; store(PERF_KEY, c); return true;
  }

  var PAPERS = [['smooth', 'ناعم', 'Smooth'], ['draw', 'ورقُ رسم', 'Drawing'], ['cold', 'ورقٌ مائيّ', 'Watercolor'], ['canvas', 'قماش', 'Canvas']];
  var RECENT_KEY = 'garden_mirsam_recent', PREF_KEY = 'garden_mirsam_prefs';

  function lang() { return (document.documentElement.getAttribute('lang') || 'ar').slice(0, 2) === 'en' ? 'en' : 'ar'; }
  function T(ar, en) { return lang() === 'en' ? en : ar; }
  function el(tag, cls, html) { var e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
  function canvas(w, h) { var c = document.createElement('canvas'); c.width = Math.max(1, w | 0); c.height = Math.max(1, h | 0); return c; }
  function ctx2(c, rf) { return c.getContext('2d', rf ? { willReadFrequently: true } : undefined); }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return '&#' + c.charCodeAt(0) + ';'; }); }
  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k) || 'null'); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }

  function hexRgb(h) { var n = parseInt(String(h).slice(1), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255]; }
  function rgbHex(r, g, b) { return '#' + ((1 << 24) | (clamp(Math.round(r), 0, 255) << 16) | (clamp(Math.round(g), 0, 255) << 8) | clamp(Math.round(b), 0, 255)).toString(16).slice(1); }
  function s2l(c) { c /= 255; return c <= .04045 ? c / 12.92 : Math.pow((c + .055) / 1.055, 2.4); }
  function l2s(c) { c = c <= .0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - .055; return c * 255; }
  function toLab(r, g, b) {
    r = s2l(r); g = s2l(g); b = s2l(b);
    var l = Math.cbrt(.4122214708 * r + .5363325363 * g + .0514459929 * b), m = Math.cbrt(.2119034982 * r + .6806995451 * g + .1073969566 * b), s = Math.cbrt(.0883024619 * r + .2817188376 * g + .6299787005 * b);
    return [.2104542553 * l + .793617785 * m - .0040720468 * s, 1.9779984951 * l - 2.428592205 * m + .4505937099 * s, .0259040371 * l + .7827717662 * m - .808675766 * s];
  }
  function fromLab(L, a, b) {
    var l = Math.pow(L + .3963377774 * a + .2158037573 * b, 3), m = Math.pow(L - .1055613458 * a - .0638541728 * b, 3), s = Math.pow(L - .0894841775 * a - 1.291485548 * b, 3);
    return [4.0767416621 * l - 3.3077115913 * m + .2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - .3413193965 * s, -.0041960863 * l - .7034186147 * m + 1.707614701 * s];
  }
  function lch(L, C, H) {
    var h = H * Math.PI / 180;
    for (var k = 0; k < 24; k++) {
      var c = fromLab(L, C * Math.cos(h), C * Math.sin(h));
      if (c[0] >= -.001 && c[0] <= 1.001 && c[1] >= -.001 && c[1] <= 1.001 && c[2] >= -.001 && c[2] <= 1.001) return rgbHex(l2s(clamp(c[0], 0, 1)), l2s(clamp(c[1], 0, 1)), l2s(clamp(c[2], 0, 1)));
      C *= .88;
    }
    var g = fromLab(L, 0, 0); return rgbHex(l2s(clamp(g[0], 0, 1)), l2s(clamp(g[1], 0, 1)), l2s(clamp(g[2], 0, 1)));
  }
  function labHex(v) { var c = fromLab(v[0], v[1], v[2]); return rgbHex(l2s(clamp(c[0], 0, 1)), l2s(clamp(c[1], 0, 1)), l2s(clamp(c[2], 0, 1))); }
  function rampOf(hex, n) {
    var v = hexRgb(hex), L = toLab(v[0], v[1], v[2]), C = Math.hypot(L[1], L[2]), H = Math.atan2(L[2], L[1]) * 180 / Math.PI;
    var out = [];
    for (var i = 0; i < n; i++) {
      var t = i / (n - 1), Lt = .97 - t * .78, k = 1 - Math.pow(Math.abs(Lt - L[0]) / .8, 1.4) * .7;
      out.push(lch(Lt, C * Math.max(.25, k), H));
    }
    return out;
  }
  var BASIC = FAMILIES.map(function (f) {
    var cmax = f[4] === 1 ? .2 : f[4] * .2;
    return { id: f[0], ar: f[1], en: f[2], shades: LIGHTS.map(function (L) { return lch(L, cmax * (1 - Math.pow(Math.abs(L - .62) / .62, 2) * .55), f[3]); }) };
  });

  function docSize(item, side, img) {
    var nw = img.naturalWidth || side, nh = img.naturalHeight || side;
    return { W: item.W || (nw >= nh ? side : Math.round(side * nw / nh)), H: item.H || (nw >= nh ? Math.round(side * nh / nw) : side) };
  }
  function lineOf(img, W, H) { var line = canvas(W, H), lc = ctx2(line); lc.fillStyle = '#fff'; lc.fillRect(0, 0, W, H); lc.drawImage(img, 0, 0, W, H); return line; }
  function sideFor(item) {
    var q = (store(PREF_KEY) || {}).quality, tier = q && TIERS[q] ? q : autoTier().tier, side = item.side || TIERS[tier].doc;
    return side;
  }
  var PRE = null;
  function precompute(item) {
    if (!item || !item.lineUrl || item.svg) return null;
    var side = sideFor(item);
    if (item.W && item.H && Math.max(item.W, item.H) > side) { var k0 = side / Math.max(item.W, item.H); item = Object.assign({}, item, { W: Math.round(item.W * k0), H: Math.round(item.H * k0) }); }
    if (PRE && PRE.url === item.lineUrl && PRE.side === side) return PRE;
    var pre = PRE = { url: item.lineUrl, side: side, ref: item.refUrl };
    if (item.refUrl) pre.refP = rasterImage(item.refUrl).then(function (ref) { try { pre.fam = extractFamilies(ref); } catch (e) {} return ref; }, function () { return null; });
    pre.p = rasterImage(item.lineUrl).then(function (img) {
      var sz = docSize(item, side, img), line = lineOf(img, sz.W, sz.H);
      pre.W = sz.W; pre.H = sz.H; pre.line = line; pre.img = img;
      pre.regionsP = Regions.build(line, Math.max(2, Math.round(sz.W / 460)), img);
      return pre;
    });
    pre.p.catch(function () { if (PRE === pre) PRE = null; });
    return pre;
  }
  function svgImage(text, w, h) {
    var s = text.replace(/<svg\b([^>]*)>/, function (m, a) {
      a = a.replace(/\s(width|height)="[^"]*"/g, '');
      return '<svg' + a + ' width="' + w + '" height="' + h + '">';
    });
    return new Promise(function (res, rej) {
      var url = URL.createObjectURL(new Blob([s], { type: 'image/svg+xml' }));
      var im = new Image();
      im.onload = function () { res(im); setTimeout(function () { URL.revokeObjectURL(url); }, 0); };
      im.onerror = function () { URL.revokeObjectURL(url); rej(new Error('svg decode')); };
      im.src = url;
    });
  }
  function rasterImage(url) {
    return new Promise(function (res, rej) {
      var im = new Image(); im.crossOrigin = 'anonymous'; im.decoding = 'async';
      im.onload = function () { if (im.decode) im.decode().then(function () { res(im); }, function () { res(im); }); else res(im); };
      im.onerror = function () { rej(new Error('img ' + url)); }; im.src = url;
    });
  }
  var HIDE_COLOR = '<style>#color,#hair,#skin,#skin-shadow,#guide{display:none}</style>';
  var HIDE_GUIDE = '<style>#guide{display:none}</style>';
  function withStyle(svg, style) { return svg.replace(/<svg\b([^>]*)>/, function (m) { return m + style; }); }

  function maxFilter(src, w, h, r, out) {
    var tmp = new Uint8Array(w * h), x, y, i, last;
    for (y = 0; y < h; y++) {
      last = -1e9; var row = y * w;
      for (x = 0; x < w; x++) { if (src[row + x]) last = x; tmp[row + x] = (x - last <= r) ? 1 : 0; }
      last = 1e9;
      for (x = w - 1; x >= 0; x--) { if (src[row + x]) last = x; if (last - x <= r) tmp[row + x] = 1; }
    }
    for (x = 0; x < w; x++) {
      last = -1e9;
      for (y = 0; y < h; y++) { i = y * w + x; if (tmp[i]) last = y; out[i] = (y - last <= r) ? 1 : 0; }
      last = 1e9;
      for (y = h - 1; y >= 0; y--) { i = y * w + x; if (tmp[i]) last = y; if (last - y <= r) out[i] = 1; }
    }
    return out;
  }

  function inkOf(lineCanvas) {
    var w = lineCanvas.width, h = lineCanvas.height, N = w * h;
    var d = ctx2(lineCanvas, true).getImageData(0, 0, w, h).data;
    var ink = new Uint8Array(N);
    for (var i = 0, j = 0; i < N; i++, j += 4) if ((d[j] * 299 + d[j + 1] * 587 + d[j + 2] * 114) / 1000 < 150) ink[i] = 1;
    return ink;
  }
  function label(ink, w, h, gap) {
    var N = w * h, wall = maxFilter(ink, w, h, gap, new Uint8Array(N));
    var lab = new Int32Array(N), n = 0, stack = new Int32Array(N), boxes = [0];
    for (var p = 0; p < N; p++) {
      if (wall[p] || lab[p]) continue;
      n++; var sp = 0, x0 = w, y0 = h, x1 = 0, y1 = 0, area = 0;
      stack[sp++] = p; lab[p] = n;
      while (sp) {
        var q = stack[--sp], qx = q % w, qy = (q - qx) / w; area++;
        if (qx < x0) x0 = qx; if (qx > x1) x1 = qx; if (qy < y0) y0 = qy; if (qy > y1) y1 = qy;
        if (qx > 0 && !wall[q - 1] && !lab[q - 1]) { lab[q - 1] = n; stack[sp++] = q - 1; }
        if (qx < w - 1 && !wall[q + 1] && !lab[q + 1]) { lab[q + 1] = n; stack[sp++] = q + 1; }
        if (qy > 0 && !wall[q - w] && !lab[q - w]) { lab[q - w] = n; stack[sp++] = q - w; }
        if (qy < h - 1 && !wall[q + w] && !lab[q + w]) { lab[q + w] = n; stack[sp++] = q + w; }
      }
      boxes.push({ x0: x0, y0: y0, x1: x1, y1: y1, area: area });
    }
    return { lab: lab, n: n, boxes: boxes };
  }
  function minRun(src, dst, n, off, step, pad, BIG, g, hh) {
    var k = 2 * pad + 1, i, v;
    for (i = 0; i < n; i++) { v = src[off + i * step]; g[i] = i % k === 0 ? v : Math.min(g[i - 1], v); }
    for (i = n - 1; i >= 0; i--) { v = src[off + i * step]; hh[i] = (i % k === k - 1 || i === n - 1) ? v : Math.min(hh[i + 1], v); }
    for (i = 0; i < n; i++) {
      var a = i - pad, b = i + pad;
      if (a < 0) a = 0; if (b > n - 1) b = n - 1;
      dst[off + i * step] = Math.floor(a / k) === Math.floor(b / k) ? (function () { var m = BIG; for (var q = a; q <= b; q++) if (src[off + q * step] < m) m = src[off + q * step]; return m; })() : Math.min(hh[a], g[b]);
    }
  }
  function order(r, w, h, pad) {
    var n = r.n, lab = r.lab, N = w * h, BIG = n + 1, ids = [], rank = new Int32Array(n + 1), L, x, y, i, k;
    for (L = 1; L <= n; L++) ids.push(L);
    ids.sort(function (a, b) { return r.boxes[b].area - r.boxes[a].area; });
    for (k = 0; k < n; k++) rank[ids[k]] = k + 1;
    var base = new Float32Array(N), tmp = new Float32Array(N), col = new Float32Array(N), ord = new Float32Array(N);
    var g = new Float32Array(Math.max(w, h)), hh = new Float32Array(Math.max(w, h));
    for (i = 0; i < N; i++) base[i] = lab[i] ? rank[lab[i]] : BIG;
    for (y = 0; y < h; y++) minRun(base, tmp, w, y * w, 1, pad, BIG, g, hh);
    for (x = 0; x < w; x++) minRun(tmp, col, h, x, w, pad, BIG, g, hh);
    var area = new Float64Array(n + 2), box = new Int32Array((n + 2) * 4);
    for (k = 0; k < n + 2; k++) { box[k * 4] = w; box[k * 4 + 1] = h; box[k * 4 + 2] = -1; box[k * 4 + 3] = -1; }
    for (y = 0; y < h; y++) {
      for (x = 0; x < w; x++) {
        i = y * w + x;
        var v = lab[i] ? base[i] : col[i];
        ord[i] = v; area[v]++;
        var o = v * 4; if (x < box[o]) box[o] = x; if (y < box[o + 1]) box[o + 1] = y; if (x > box[o + 2]) box[o + 2] = x; if (y > box[o + 3]) box[o + 3] = y;
      }
    }
    r.ord = ord; r.area = area; r.rbox = box;
    return r;
  }
  function Regions(r, w, h, gap) {
    this.w = w; this.h = h; this.lab = r.lab; this.n = r.n; this.boxes = r.boxes; this.gap = gap; this.cache = new Map();
  }
  var regW = null, regSeq = 0, regWait = {};
  function inkBits(d, N) {
    var ink = new Uint8Array(N);
    for (var i = 0, j = 0; i < N; i++, j += 4) if ((d[j] * 299 + d[j + 1] * 587 + d[j + 2] * 114) / 1000 < 150) ink[i] = 1;
    return ink;
  }
  function inkOfBitmap(bm, w, h) {
    var c = new OffscreenCanvas(w, h), x = c.getContext('2d', { willReadFrequently: true });
    x.fillStyle = '#fff'; x.fillRect(0, 0, w, h); x.drawImage(bm, 0, 0, w, h); bm.close && bm.close();
    return inkBits(x.getImageData(0, 0, w, h).data, w * h);
  }
  function labelAsync(src, w, h, gap) {
    var ink0 = null, inkM = function () { return ink0 || (ink0 = inkOf(src.canvas)); };
    var sync = function () { var r = label(inkM(), w, h, gap); return { r: r, o: function () { return order({ n: r.n, lab: r.lab, boxes: r.boxes }, w, h, gap + 3); } }; };
    var done = function (s) { return { r: Promise.resolve(s.r), o: new Promise(function (k) { setTimeout(function () { k(s.o()); }, 0); }) }; };
    try {
      if (!regW) {
        var u = URL.createObjectURL(new Blob([maxFilter.toString() + label.toString() + minRun.toString() + order.toString() + inkBits.toString() + inkOfBitmap.toString() +
          'onmessage=function(e){var d=e.data,ink;try{ink=d.ink||inkOfBitmap(d.bm,d.w,d.h);}catch(x){postMessage({id:d.id,fail:1});return;}var r=label(ink,d.w,d.h,d.gap),l2=r.lab.slice();r.id=d.id;postMessage(r,[r.lab.buffer]);' +
          'var o=order({n:r.n,lab:l2,boxes:r.boxes},d.w,d.h,d.gap+3);postMessage({id:d.id,two:1,ord:o.ord,area:o.area,rbox:o.rbox},[o.ord.buffer,o.area.buffer,o.rbox.buffer]);};'], { type: 'text/javascript' }));
        regW = new Worker(u);
        regW.onmessage = function (e) {
          var k = regWait[e.data.id]; if (!k) return;
          if (e.data.fail) { regW.postMessage({ id: e.data.id, ink: k.ink(), w: k.w, h: k.h, gap: k.gap }); return; }
          if (e.data.two) { delete regWait[e.data.id]; k.ok2(e.data); } else k.ok(e.data);
        };
        regW.onerror = function () { var w = regWait; regWait = {}; regW = null; Object.keys(w).forEach(function (id) { var s = w[id].sync(); w[id].ok(s.r); w[id].ok2(s.o()); }); };
      }
      var id = ++regSeq, e = { sync: sync, ink: inkM, w: w, h: h, gap: gap };
      var out = { r: new Promise(function (k) { e.ok = k; }), o: new Promise(function (k) { e.ok2 = k; }) };
      regWait[id] = e;
      var viaInk = function () { if (regWait[id] === e) regW.postMessage({ id: id, ink: inkM(), w: w, h: h, gap: gap }); };
      if (src.img && window.createImageBitmap && window.OffscreenCanvas) {
        createImageBitmap(src.img).then(function (bm) { if (regW && regWait[id] === e) regW.postMessage({ id: id, bm: bm, w: w, h: h, gap: gap }, [bm]); }, viaInk);
      } else viaInk();
      return out;
    } catch (x) { return done(sync()); }
  }
  Regions.build = function (lineCanvas, gap, img) {
    var w = lineCanvas.width, h = lineCanvas.height, j = labelAsync({ canvas: lineCanvas, img: img }, w, h, gap);
    return j.r.then(function (r) {
      var R = new Regions(r, w, h, gap);
      R.ordP = j.o.then(function (o) { R.ord = o.ord; R.area = o.area; R.rbox = o.rbox; return R; });
      return R;
    });
  };
  Regions.prototype.at = function (x, y) {
    x = x | 0; y = y | 0;
    if (x < 0 || y < 0 || x >= this.w || y >= this.h) return 0;
    var l = this.lab[y * this.w + x];
    if (l) return l;
    for (var r = 1; r <= this.gap + 3; r++) {
      for (var k = 0; k < 8; k++) {
        var a = k * Math.PI / 4, xx = (x + Math.cos(a) * r) | 0, yy = (y + Math.sin(a) * r) | 0;
        if (xx >= 0 && yy >= 0 && xx < this.w && yy < this.h && this.lab[yy * this.w + xx]) return this.lab[yy * this.w + xx];
      }
    }
    return 0;
  };
  function maskOf(r8, x, y, w, h, area) {
    var m = { r8: r8, x: x, y: y, w: w, h: h, area: area };
    m.mkBlur = function () {
      var c = canvas(w, h), cx = ctx2(c), id = cx.createImageData(w, h);
      for (var k = 0; k < r8.length; k++) if (r8[k]) { id.data[k * 4] = id.data[k * 4 + 1] = id.data[k * 4 + 2] = 255; id.data[k * 4 + 3] = 255; }
      cx.putImageData(id, 0, 0);
      var bl = canvas(w, h), bx = ctx2(bl), rad = Math.max(3, Math.min(w, h) / 7);
      bx.fillStyle = '#000'; bx.fillRect(0, 0, w, h);
      if (typeof bx.filter !== 'string') return null;
      bx.filter = 'blur(' + rad + 'px)'; bx.drawImage(c, 0, 0); bx.filter = 'none';
      return bl;
    };
    return m;
  }
  Regions.prototype.mask = function (L) {
    if (this.cache.has(L)) { var hit = this.cache.get(L); this.cache.delete(L); this.cache.set(L, hit); return hit; }
    var b = this.boxes[L], pad = this.gap + 3, w = this.w, h = this.h;
    var x0 = Math.max(0, b.x0 - pad), y0 = Math.max(0, b.y0 - pad), x1 = Math.min(w - 1, b.x1 + pad), y1 = Math.min(h - 1, b.y1 + pad);
    var mw = x1 - x0 + 1, mh = y1 - y0 + 1, M = mw * mh, src = new Uint8Array(M), allow = new Uint8Array(M);
    for (var y = 0; y < mh; y++) for (var x = 0; x < mw; x++) {
      var l = this.lab[(y + y0) * w + x + x0], i = y * mw + x;
      if (l === L) { src[i] = 1; allow[i] = 1; } else if (l === 0) allow[i] = 1;
    }
    var grown = maxFilter(src, mw, mh, pad, new Uint8Array(M));
    for (var k = 0; k < M; k++) grown[k] = grown[k] && allow[k] ? 255 : 0;
    var m = maskOf(grown, x0, y0, mw, mh, b.area); m.lab = L;
    this.cache.set(L, m);
    if (this.cache.size > 24) this.cache.delete(this.cache.keys().next().value);
    return m;
  };

  function extractFamilies(img) {
    var S = 160, c = canvas(S, Math.max(1, Math.round(S * img.naturalHeight / img.naturalWidth))), x = ctx2(c, true);
    x.drawImage(img, 0, 0, c.width, c.height);
    var d = x.getImageData(0, 0, c.width, c.height).data, pts = [];
    for (var i = 0; i < d.length; i += 4) {
      var v = toLab(d[i], d[i + 1], d[i + 2]);
      if (v[0] < .16) continue;
      if (v[0] > .97 && Math.hypot(v[1], v[2]) < .015) continue;
      pts.push(v);
    }
    if (pts.length < 40) return [];
    var seed = 7;
    function rnd() { seed = (seed * 16807) % 2147483647; return seed / 2147483647; }
    function dist(a, b) { var dl = (a[0] - b[0]) * .35, da = a[1] - b[1], db = a[2] - b[2]; return dl * dl + da * da + db * db; }
    var K = 14, cent = [pts[(rnd() * pts.length) | 0].slice()];
    while (cent.length < K) {
      var best = null, bd = -1;
      for (var t = 0; t < 80; t++) {
        var p = pts[(rnd() * pts.length) | 0], md = 1e9;
        for (var k = 0; k < cent.length; k++) { var dd = dist(p, cent[k]); if (dd < md) md = dd; }
        if (md > bd) { bd = md; best = p; }
      }
      cent.push(best.slice());
    }
    var asg = new Int32Array(pts.length);
    for (var it = 0; it < 10; it++) {
      var sum = cent.map(function () { return [0, 0, 0, 0]; });
      for (var q = 0; q < pts.length; q++) {
        var bi = 0, bv = 1e9;
        for (var kk = 0; kk < K; kk++) { var dv = dist(pts[q], cent[kk]); if (dv < bv) { bv = dv; bi = kk; } }
        asg[q] = bi; var s = sum[bi]; s[0] += pts[q][0]; s[1] += pts[q][1]; s[2] += pts[q][2]; s[3]++;
      }
      for (var k2 = 0; k2 < K; k2++) if (sum[k2][3]) cent[k2] = [sum[k2][0] / sum[k2][3], sum[k2][1] / sum[k2][3], sum[k2][2] / sum[k2][3]];
    }
    var groups = cent.map(function (cc) { return { c: cc, m: [] }; });
    for (var q2 = 0; q2 < pts.length; q2++) groups[asg[q2]].m.push(pts[q2]);
    groups = groups.filter(function (g) { return g.m.length > pts.length * .004; }).sort(function (a, b) { return b.m.length - a.m.length; });
    var merged = [];
    groups.forEach(function (g) {
      var cg = Math.hypot(g.c[1], g.c[2]);
      for (var j = 0; j < merged.length; j++) {
        var h = merged[j], ch = Math.hypot(h.c[1], h.c[2]);
        var dh = cg < .03 && ch < .03 ? 0 : Math.abs(((Math.atan2(g.c[2], g.c[1]) - Math.atan2(h.c[2], h.c[1])) * 180 / Math.PI + 540) % 360 - 180);
        if ((cg < .03) === (ch < .03) && dh < 11 && Math.abs(cg - ch) < .04) { h.m = h.m.concat(g.m); return; }
      }
      merged.push(g);
    });
    return merged.slice(0, 12).map(function (g) {
      g.m.sort(function (a, b) { return a[0] - b[0]; });
      var n = g.m.length, raw = [];
      [.02, .12, .26, .42, .58, .74, .88, .98].forEach(function (pc) {
        var mid = Math.round(pc * (n - 1)), half = Math.max(1, Math.round(n * .04)), a = [0, 0, 0], c2 = 0;
        for (var u = Math.max(0, mid - half); u <= Math.min(n - 1, mid + half); u++) { a[0] += g.m[u][0]; a[1] += g.m[u][1]; a[2] += g.m[u][2]; c2++; }
        raw.push([a[0] / c2, a[1] / c2, a[2] / c2]);
      });
      var lo = raw[0][0], hi = raw[raw.length - 1][0];
      if (hi - lo < .3) {
        var base = g.c, C = Math.hypot(base[1], base[2]), H = Math.atan2(base[2], base[1]);
        raw = [];
        for (var z = 0; z < 8; z++) { var L = Math.max(.2, Math.min(.95, base[0] - .32 + z * .09)), k3 = 1 - Math.pow(Math.abs(L - base[0]) / .7, 1.5) * .6; raw.push([L, C * k3 * Math.cos(H), C * k3 * Math.sin(H)]); }
      }
      var shades = raw.map(labHex).filter(function (h, i, arr) { return arr.indexOf(h) === i; }).reverse();
      var Cc = Math.hypot(g.c[1], g.c[2]), Hh = (Math.atan2(g.c[2], g.c[1]) * 180 / Math.PI + 360) % 360;
      return { base: labHex(g.c), shades: shades, hue: Cc < .03 ? 999 + g.c[0] : Hh, share: n / pts.length };
    }).sort(function (a, b) { return a.hue - b.hue; });
  }

  var SVG_DEFS = '<svg class="mrs-defs" aria-hidden="true" width="0" height="0" style="position:absolute"><defs>' +
    '<linearGradient id="mrsCyl" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".28" stop-color="#fff" stop-opacity=".12"/><stop offset=".55" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".38"/></linearGradient>' +
    '<linearGradient id="mrsMetal" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4f5f7"/><stop offset=".35" stop-color="#b8bcc4"/><stop offset=".6" stop-color="#e3e5ea"/><stop offset="1" stop-color="#6d727c"/></linearGradient>' +
    '<linearGradient id="mrsWood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f3dcb8"/><stop offset=".5" stop-color="#e2bf8f"/><stop offset="1" stop-color="#b98d5a"/></linearGradient>' +
    '<linearGradient id="mrsGlass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset=".4" stop-color="#fff" stop-opacity=".15"/><stop offset="1" stop-color="#fff" stop-opacity=".35"/></linearGradient>' +
    '</defs></svg>';

  var ART = {
    pencil: '<rect x="2" y="7" width="90" height="18" rx="1.5" fill="var(--c)"/><rect x="2" y="7" width="90" height="6" fill="#fff" opacity=".22"/><rect x="2" y="19" width="90" height="6" fill="#000" opacity=".18"/><rect x="2" y="7" width="90" height="18" fill="url(#mrsCyl)" opacity=".6"/>' +
      '<rect x="2" y="7" width="4" height="18" fill="#000" opacity=".25"/><path d="M92 7 L122 13.4 L122 18.6 L92 25 Z" fill="url(#mrsWood)"/><path d="M96 9 Q106 14 116 13.8 M97 22 Q107 18 116 18.2" stroke="#a87b4c" stroke-width=".6" fill="none" opacity=".6"/>' +
      '<path d="M114 12.3 L136 16 L114 19.7 Z" fill="var(--c)"/><path d="M114 12.3 L136 16 L114 14.6 Z" fill="#fff" opacity=".3"/>',
    graphite: '<rect x="2" y="7" width="90" height="18" rx="1.5" fill="#f2c230"/><rect x="2" y="7" width="90" height="6" fill="#fff" opacity=".25"/><rect x="2" y="19" width="90" height="6" fill="#000" opacity=".15"/><rect x="2" y="7" width="90" height="18" fill="url(#mrsCyl)" opacity=".5"/>' +
      '<rect x="2" y="7" width="12" height="18" fill="url(#mrsMetal)"/><rect x="2" y="7" width="5" height="18" fill="#e98aa0"/>' +
      '<path d="M92 7 L122 13.4 L122 18.6 L92 25 Z" fill="url(#mrsWood)"/><path d="M114 12.3 L136 16 L114 19.7 Z" fill="#3a3b40"/><path d="M114 12.3 L136 16 L114 14.4 Z" fill="#c9cbd2" opacity=".5"/>',
    marker: '<rect x="2" y="6" width="44" height="20" rx="4" fill="var(--c)"/><rect x="2" y="6" width="44" height="20" rx="4" fill="url(#mrsCyl)" opacity=".7"/><rect x="40" y="5" width="66" height="22" rx="5" fill="#f4f5f7"/><rect x="40" y="5" width="66" height="22" rx="5" fill="url(#mrsCyl)" opacity=".55"/>' +
      '<rect x="58" y="12" width="30" height="8" rx="2" fill="var(--c)" opacity=".85"/><path d="M106 9 L118 11 L118 21 L106 23 Z" fill="#d9dbe0"/><path d="M118 11 L136 13 L131 21 L118 21 Z" fill="var(--c)"/><path d="M118 11 L136 13 L134 15.5 L118 14 Z" fill="#fff" opacity=".35"/>',
    wash: '<path d="M2 13 Q40 11.5 76 12.5 L76 19.5 Q40 20.5 2 19 Z" fill="#8c2b2b"/><path d="M2 13 Q40 11.5 76 12.5 L76 19.5 Q40 20.5 2 19 Z" fill="url(#mrsCyl)" opacity=".6"/><rect x="76" y="11" width="22" height="10" rx="1.5" fill="url(#mrsMetal)"/>' +
      '<path d="M98 10.5 Q112 9 122 13 Q130 15.5 138 16 Q130 16.5 122 19 Q112 23 98 21.5 Z" fill="#6b4a2c"/><path d="M110 9.8 Q118 10.6 122 13 Q130 15.5 138 16 Q130 16.5 122 19 Q118 21.4 110 22.2 Z" fill="var(--c)"/><path d="M112 11 Q122 12.4 136 15.6" stroke="#fff" stroke-width="1" fill="none" opacity=".45"/>',
    crayon: '<rect x="2" y="8" width="100" height="16" rx="3" fill="var(--c)"/><rect x="14" y="8" width="72" height="16" fill="#f3f0e6"/><rect x="14" y="8" width="72" height="16" fill="var(--c)" opacity=".18"/><path d="M14 11 H86 M14 21 H86" stroke="var(--c)" stroke-width="1.2" opacity=".75"/>' +
      '<rect x="2" y="8" width="100" height="16" rx="3" fill="url(#mrsCyl)" opacity=".55"/><path d="M102 8.5 L128 12.5 Q133 16 128 19.5 L102 23.5 Z" fill="var(--c)"/><path d="M102 8.5 L128 12.5 Q130 14 128 14.6 L102 12 Z" fill="#fff" opacity=".3"/>',
    pastel: '<path d="M8 9 L104 9 L104 23 L8 23 Z" fill="var(--c)"/><path d="M104 9 L130 12 Q135 16 130 20 L104 23 Z" fill="var(--c)"/><path d="M8 9 L104 9 L104 23 L8 23 Z" fill="url(#mrsCyl)" opacity=".45"/>' +
      '<g fill="#fff" opacity=".35"><circle cx="20" cy="13" r=".8"/><circle cx="33" cy="18" r=".7"/><circle cx="51" cy="12" r=".9"/><circle cx="68" cy="19" r=".6"/><circle cx="84" cy="14" r=".8"/><circle cx="118" cy="15" r="1"/></g><path d="M8 9 L8 23" stroke="#000" opacity=".2" stroke-width="2"/>',
    oil: '<path d="M2 14 Q36 12.5 70 13 L70 19 Q36 19.5 2 18 Z" fill="#1d2a44"/><path d="M2 14 Q36 12.5 70 13 L70 19 Q36 19.5 2 18 Z" fill="url(#mrsCyl)" opacity=".6"/><path d="M70 11.5 L96 8 L96 24 L70 20.5 Z" fill="url(#mrsMetal)"/>' +
      '<rect x="96" y="7" width="26" height="18" fill="#d8c7a4"/><path d="M98 8 V24 M102 8 V24 M106 8 V24 M110 8 V24 M114 8 V24" stroke="#a58e66" stroke-width=".6"/><path d="M110 7 H124 Q137 8 137 16 Q137 24 124 25 H110 Z" fill="var(--c)"/><path d="M112 9 Q128 9 134 13" stroke="#fff" stroke-width="1.1" fill="none" opacity=".5"/>',
    airbrush: '<rect x="18" y="12" width="78" height="9" rx="4.5" fill="url(#mrsMetal)"/><rect x="40" y="3" width="16" height="10" rx="3" fill="url(#mrsMetal)"/><path d="M42 4 h12 v6 h-12 z" fill="var(--c)"/><rect x="10" y="20" width="10" height="11" rx="2" fill="#6d727c"/>' +
      '<path d="M96 13 L122 15 L122 18 L96 20 Z" fill="url(#mrsMetal)"/><path d="M122 15 L132 16.5 L122 18 Z" fill="#454a52"/><g fill="var(--c)"><circle cx="135" cy="14" r=".9"/><circle cx="137" cy="17.5" r=".8"/><circle cx="133.5" cy="19" r=".7"/></g>',
    ink: '<rect x="2" y="8" width="88" height="16" rx="5" fill="#1d1f24"/><rect x="2" y="8" width="88" height="16" rx="5" fill="url(#mrsCyl)" opacity=".5"/><rect x="70" y="8" width="6" height="16" fill="var(--c)"/><path d="M90 8.5 L112 13 L112 19 L90 23.5 Z" fill="#2b2e35"/>' +
      '<rect x="112" y="14.6" width="16" height="2.8" fill="url(#mrsMetal)"/><path d="M128 15 L134 16 L128 17 Z" fill="var(--c)"/>',
    gel: '<rect x="2" y="8" width="90" height="16" rx="6" fill="#e9eef5" opacity=".92"/><rect x="8" y="14" width="80" height="4" rx="2" fill="var(--c)"/><rect x="2" y="8" width="90" height="16" rx="6" fill="url(#mrsGlass)"/><rect x="60" y="8" width="28" height="16" rx="3" fill="#2c3038" opacity=".85"/>' +
      '<path d="M92 9 L118 14 L118 18 L92 23 Z" fill="#cfd4dc"/><path d="M118 14.3 L132 16 L118 17.7 Z" fill="url(#mrsMetal)"/><circle cx="133" cy="16" r="1.4" fill="var(--c)"/>',
    blend: '<path d="M4 9 L110 9 Q134 13 138 16 Q134 19 110 23 L4 23 Z" fill="#d9d6cf"/><path d="M4 9 L110 9 Q134 13 138 16 Q134 19 110 23 L4 23 Z" fill="url(#mrsCyl)" opacity=".55"/>' +
      '<path d="M14 9 L22 23 M34 9 L42 23 M54 9 L62 23 M74 9 L82 23 M94 9 L102 23" stroke="#a9a49a" stroke-width=".8"/><path d="M118 11.5 Q132 14 138 16 Q132 18 118 20.5 Z" fill="var(--c)" opacity=".55"/><path d="M118 11.5 Q132 14 138 16 Q132 18 118 20.5 Z" fill="#555" opacity=".25"/>',
    eraser: '<path d="M22 7 L118 7 Q124 7 126 12 L132 25 L28 25 Q22 25 20 20 Z" fill="#f6f2ec"/><path d="M84 7 L118 7 Q124 7 126 12 L132 25 L96 25 Z" fill="#ef8fa2"/><path d="M22 7 L118 7 Q124 7 126 12 L132 25 L28 25 Q22 25 20 20 Z" fill="url(#mrsCyl)" opacity=".4"/>',
    fill: '<path d="M30 6 L74 6 L70 28 L34 28 Z" fill="url(#mrsMetal)"/><ellipse cx="52" cy="6.5" rx="22" ry="3.2" fill="#3b3f47"/><ellipse cx="52" cy="6.8" rx="19" ry="2.4" fill="var(--c)"/>' +
      '<path d="M72 8 Q96 4 112 12 Q124 18 132 26 Q120 24 108 19 Q92 13 72 10 Z" fill="var(--c)"/><path d="M30 6 Q52 -2 74 6" stroke="#6d727c" stroke-width="1.6" fill="none"/><circle cx="134" cy="28.5" r="2.4" fill="var(--c)"/>',
    pick: '<ellipse cx="22" cy="16" rx="18" ry="8" fill="#2d2f36"/><ellipse cx="18" cy="13" rx="9" ry="3" fill="#fff" opacity=".12"/><rect x="38" y="12" width="8" height="8" fill="#555a63"/>' +
      '<path d="M46 12.5 L118 14.5 L118 17.5 L46 19.5 Z" fill="#dfe8f2" opacity=".75"/><path d="M78 13.4 L118 14.5 L118 17.5 L78 18.6 Z" fill="var(--c)"/><path d="M46 12.5 L118 14.5 L118 15.5 L46 14.5 Z" fill="#fff" opacity=".6"/>' +
      '<path d="M118 14.5 L132 15.6 L132 16.4 L118 17.5 Z" fill="#dfe8f2" opacity=".8"/><circle cx="136" cy="16" r="2" fill="var(--c)"/>'
  };
  function art(id) { return '<svg class="mrs-art" viewBox="0 0 140 32" aria-hidden="true" focusable="false">' + ART[id] + '</svg>'; }

  function Studio(host, opts) {
    this.opts = opts || {};
    this.host = host;
    var pref = store(PREF_KEY) || {};
    this.sizes = pref.sizes || {};
    this.tool = BYID[pref.tool] && pref.tool !== 'fill' && pref.tool !== 'pick' ? pref.tool : 'pencil';
    this.medium = this.tool;
    this.color = pref.color || '#2563eb';
    this.strength = pref.strength == null ? .6 : pref.strength;
    this.grade = pref.grade || .62;
    this.lock = true; this.shade = !!pref.shade;
    this.paperKind = pref.paper || 'draw';
    this.quality = QUALS.some(function (q) { return q[0] === pref.quality; }) ? pref.quality : 'auto';
    this.help = pref.help == null ? true : !!pref.help;
    this.helpN = !!pref.helpN;
    this.dockH = pref.dockH || null;
    this.cat = pref.cat || 'orig';
    this.recent = (store(RECENT_KEY) || []).filter(function (h) { return /^#[0-9a-f]{6}$/i.test(h); }).slice(0, 14);
    this.view = { s: 1, x: 0, y: 0, fit: true };
    this.families = null;
    this.changed = 0;
    this.build();
  }

  Studio.prototype.build = function () {
    var self = this;
    var root = el('div', 'mrs');
    root.innerHTML = SVG_DEFS +
      '<canvas class="mrs-gl"></canvas>' +
      '<svg class="mrs-cursor" aria-hidden="true" hidden><g class="mrs-cur-g"><circle class="mrs-cur-o" r="10"/><circle class="mrs-cur-i" r="10"/></g><circle class="mrs-cur-dot" r="1.2"/></svg>' +
      '<header class="mrs-top">' +
        '<button type="button" class="mrs-ib mrs-close"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button>' +
        '<h2 class="mrs-title"></h2><span class="mrs-sp"></span>' +
        '<div class="mrs-grp"><button type="button" class="mrs-ib mrs-undo" disabled><i class="fa-solid fa-rotate-left" aria-hidden="true"></i></button>' +
        '<button type="button" class="mrs-ib mrs-redo" disabled><i class="fa-solid fa-rotate-right" aria-hidden="true"></i></button>' +
        '<button type="button" class="mrs-ib mrs-wipe"><i class="fa-solid fa-broom" aria-hidden="true"></i></button></div>' +
        '<div class="mrs-grp mrs-zoom"><button type="button" class="mrs-ib mrs-finger" aria-pressed="false"><i class="fa-solid fa-hand-pointer" aria-hidden="true"></i></button><button type="button" class="mrs-ib mrs-hand" aria-pressed="false"><i class="fa-solid fa-hand" aria-hidden="true"></i></button>' +
        '<button type="button" class="mrs-ib mrs-zout"><i class="fa-solid fa-minus" aria-hidden="true"></i></button>' +
        '<button type="button" class="mrs-zpct"></button>' +
        '<button type="button" class="mrs-ib mrs-zin"><i class="fa-solid fa-plus" aria-hidden="true"></i></button>' +
        '<button type="button" class="mrs-ib mrs-fit"><i class="fa-solid fa-expand" aria-hidden="true"></i></button></div>' +
        '<button type="button" class="gsf-btn gsf-btn--sm mrs-auto"><i class="fa-solid fa-wand-magic-sparkles" aria-hidden="true"></i><span></span></button>' +
        '<button type="button" class="gsf-btn gsf-btn--sm mrs-orig" aria-pressed="false"><i class="fa-solid fa-eye" aria-hidden="true"></i><span></span></button>' +
        '<button type="button" class="mrs-ib mrs-file" aria-haspopup="menu"><i class="fa-solid fa-floppy-disk" aria-hidden="true"></i></button>' +
        '<button type="button" class="mrs-ib mrs-menu" aria-haspopup="menu"><i class="fa-solid fa-ellipsis" aria-hidden="true"></i></button>' +
        '<button type="button" class="gsf-btn gsf-btn--go mrs-insert"><span class="mrs-long"></span><span class="mrs-short"></span></button>' +
      '</header>' +
      '<div class="mrs-lesson" hidden></div>' +
      '<div class="mrs-rack" role="toolbar"></div>' +
      '<div class="mrs-side"><button type="button" class="mrs-tip"><span></span></button>' +
        '<input class="mrs-size" type="range" min="0" max="1" step="0.005">' +
        '<input class="mrs-str" type="range" min="0" max="1" step="0.01"><i class="fa-solid fa-droplet mrs-str-i" aria-hidden="true"></i></div>' +
      '<section class="mrs-dock">' +
        '<div class="mrs-grip gsf-handle" role="separator" tabindex="0"></div>' +
        '<div class="mrs-now"><span class="mrs-now-i" aria-hidden="true"></span><b class="mrs-now-n"></b><kbd class="mrs-now-k"></kbd><span class="mrs-sp"></span>' +
          '<button type="button" class="mrs-chip mrs-help" aria-pressed="false"><i class="fa-solid fa-circle-question" aria-hidden="true"></i><span></span></button></div>' +
        '<div class="mrs-guide" hidden></div>' +
        '<div class="mrs-dhead"><span class="mrs-cur" aria-hidden="true"></span><span class="mrs-cname"></span><span class="mrs-sp"></span>' +
          '<button type="button" class="mrs-chip mrs-lock" aria-pressed="true"><i class="fa-solid fa-shapes" aria-hidden="true"></i><span></span></button>' +
          '<button type="button" class="mrs-chip mrs-shade" aria-pressed="false"><i class="fa-solid fa-circle-half-stroke" aria-hidden="true"></i><span></span></button>' +
          '<button type="button" class="mrs-ib mrs-more" aria-expanded="false"><i class="fa-solid fa-sliders" aria-hidden="true"></i></button>' +
          '<button type="button" class="mrs-ib mrs-fold" aria-expanded="true"><i class="fa-solid fa-chevron-down" aria-hidden="true"></i></button></div>' +
        '<div class="mrs-opts" hidden><span class="mrs-olbl"></span><div class="mrs-papers"></div><span class="mrs-olbl mrs-qlbl"></span><div class="mrs-quals"></div>' +
          '<span class="mrs-olbl mrs-plbl"></span><div class="mrs-palms"></div><button type="button" class="mrs-chip mrs-penbtn"><i class="fa-solid fa-pen-nib" aria-hidden="true"></i><span></span></button></div>' +
        '<div class="mrs-tabs" role="tablist"></div>' +
        '<div class="mrs-shades" aria-label=""></div>' +
        '<div class="mrs-sw"></div>' +
      '</section>' +
      '<button type="button" class="mrs-peek" hidden><i class="fa-solid fa-eye-slash" aria-hidden="true"></i><span></span></button>' +
      '<div class="mrs-busy"><i class="fa-solid fa-palette" aria-hidden="true"></i></div>' +
      '<div class="mrs-rebuild" role="status" hidden><b></b><span class="mrs-rb-bar"><i></i></span><small></small></div>' +
      '<div class="mrs-toast" role="status" hidden></div>';
    this.root = root;
    this.$ = function (s) { return root.querySelector(s); };
    var rack = this.$('.mrs-rack');
    var lastG = null;
    TOOLS.forEach(function (t) {
      if (t.grp !== lastG) { var hh = el('span', 'mrs-rk'); hh.dataset.grp = t.grp; hh.setAttribute('aria-hidden', 'true'); rack.appendChild(hh); lastG = t.grp; }
      var b = el('button', 'mrs-tool');
      b.type = 'button'; b.dataset.tool = t.id;
      b.innerHTML = art(t.id) + '<span class="mrs-tl"></span>';
      b.addEventListener('click', function () { self.setTool(t.id); });
      rack.appendChild(b);
    });
    var quals = this.$('.mrs-quals');
    QUALS.forEach(function (q) {
      var b = el('button', 'mrs-chip'); b.type = 'button'; b.dataset.q = q[0];
      b.addEventListener('click', function () {
        self.quality = q[0]; self.savePrefs();
        var t = q[0] === 'auto' ? autoTier() : { tier: q[0], cap: TIERS[q[0]].cap };
        self.perf = t; self.dprCap = t.cap; self.layout(); self.paintChrome();
        self.toast(T('تُطبَّق حدّةُ العرض الآن، وحجمُ الرسمة من الرسمة التالية.', 'Display sharpness applies now; drawing size applies from the next drawing.'));
      });
      quals.appendChild(b);
    });
    var palms = this.$('.mrs-palms');
    PALMS.forEach(function (m) {
      var b = el('button', 'mrs-chip'); b.type = 'button'; b.dataset.palm = m[0];
      b.addEventListener('click', function () { self.setPalm(m[0]); });
      palms.appendChild(b);
    });
    this.$('.mrs-finger').addEventListener('click', function () { self.setPalm(self.palm() === 'never' ? 'auto' : 'never', true); });
    this.$('.mrs-penbtn').addEventListener('click', function () {
      var D = window.GardenNotesDial;
      if (D && D.penButtons) D.penButtons();
      else self.toast(T('أزرارُ القلم تُضبط من الملاحظات.', 'Pen buttons are set in Notes.'));
    });
    var papers = this.$('.mrs-papers');
    PAPERS.forEach(function (p) {
      var b = el('button', 'mrs-chip'); b.type = 'button'; b.dataset.paper = p[0];
      b.addEventListener('click', function () { self.setPaper(p[0]); });
      papers.appendChild(b);
    });
    this.$('.mrs-close').addEventListener('click', function () { if (self.opts.onClose) self.opts.onClose(self); });
    this.$('.mrs-insert').addEventListener('click', function () { if (self.opts.onInsert) self.opts.onInsert(self); });
    this.$('.mrs-file').addEventListener('click', function (e) { self.fileMenu(e.currentTarget); });
    this.$('.mrs-menu').addEventListener('click', function (e) { self.moreMenu(e.currentTarget); });
    this.$('.mrs-help').addEventListener('click', function () { self.toggleHelp(); });
    this.bindGrip();
    this.bindRackDrag();
    this.$('.mrs-undo').addEventListener('click', function () { self.step(-1); });
    this.$('.mrs-redo').addEventListener('click', function () { self.step(1); });
    this.$('.mrs-wipe').addEventListener('click', function () { self.wipe(); });
    this.$('.mrs-zin').addEventListener('click', function () { self.zoomBy(1.5); });
    this.$('.mrs-zout').addEventListener('click', function () { self.zoomBy(1 / 1.5); });
    this.$('.mrs-fit').addEventListener('click', function () { self.fit(); });
    this.$('.mrs-zpct').addEventListener('click', function () { if (Math.abs(self.view.s * self.dpr() - 1) < .02) self.fit(); else self.zoomTo(1 / self.dpr()); });
    this.$('.mrs-orig').addEventListener('click', function () { self.setOrig(!self.orig); });
    this.$('.mrs-hand').addEventListener('click', function () { self.setHand(!self.hand); });
    this.$('.mrs-auto').addEventListener('click', function () { self.autoPaint(); });
    this.$('.mrs-peek').addEventListener('click', function () { self.setOrig(false); });
    this.$('.mrs-lock').addEventListener('click', function () { self.lock = !self.lock; self.paintChrome(); });
    this.$('.mrs-shade').addEventListener('click', function () { self.shade = !self.shade; self.savePrefs(); self.paintChrome(); });
    this.$('.mrs-more').addEventListener('click', function () { var o = self.$('.mrs-opts'); o.hidden = !o.hidden; self.paintChrome(); self.layout(); });
    this.$('.mrs-tip').addEventListener('click', function () { self.$('.mrs-side').classList.toggle('is-open'); });
    this.$('.mrs-fold').addEventListener('click', function () { root.classList.toggle('is-folded'); self.paintChrome(); self.layout(); });
    var size = this.$('.mrs-size'), str = this.$('.mrs-str');
    size.addEventListener('input', function () { self.sizes[self.sizeKey()] = +size.value; self.paintTip(); });
    size.addEventListener('change', function () { self.savePrefs(); });
    str.addEventListener('input', function () { self.strength = +str.value; self.paintTip(); });
    str.addEventListener('change', function () { self.savePrefs(); });
    this.host.appendChild(root);
    this.glOK = !!window.GardenPaintGL && GardenPaintGL.supported();
    this.bindInput();
    this.bindKeys();
    this.ro = new ResizeObserver(function () { self.layout(); });
    this.ro.observe(root);
    this._onLang = function () { self.paintChrome(); self.paintPalette(); };
    document.addEventListener('garden:languageChanged', this._onLang);
    this.setTool(this.tool, true);
    this.paintChrome();
  };

  Studio.prototype.dpr = function () { return Math.min(this.dprCap || 2.5, window.devicePixelRatio || 1); };
  Studio.prototype.gpuInfo = function () {
    var gl = this.S && this.S.gl, r = this.S && this.S.shd ? this.S.shd.name : '';
    if (!r) try { var x = gl && gl.getExtension('WEBGL_debug_renderer_info'); r = x ? gl.getParameter(x.UNMASKED_RENDERER_WEBGL) : (gl ? gl.getParameter(gl.RENDERER) : ''); } catch (e) {}
    return { renderer: String(r || ''), soft: /swiftshader|llvmpipe|basic render|software|microsoft basic/i.test(String(r || '')) };
  };
  Studio.prototype.checkGpu = function () {
    if (this._gpuChecked || !this.S) return; this._gpuChecked = true;
    var g = this.gpuInfo(); this.gpu = g;
    if (g.soft) {
      this.dprCap = 1; this.layout();
      if (this.quality === 'auto' && this.perf && this.perf.tier !== 'low') { this.perf.tier = 'low'; this.perf.cap = 1; store(PERF_KEY, this.perf); }
      this.toast(T('متصفّحُك يرسم بلا بطاقة الرسوم فيبطؤ الرسم — فعّلْ «استخدام تسريع الرسومات» من إعداداته ثمّ أعِدْ تشغيله.', 'Your browser is drawing without the graphics card, so drawing is slow — turn on "Use graphics acceleration" in its settings, then restart it.'));
    }
    if (store('garden_mrsdiag')) this.diag();
  };
  Studio.prototype.diag = function () {
    var self = this, box = el('pre', 'mrs-diag'), ev = 0, fr = 0, worst = 0, last = performance.now(), mx = 0;
    box.setAttribute('dir', 'ltr');
    box.style.cssText = 'position:absolute;z-index:9;inset-block-start:3.6rem;inset-inline-end:11rem;margin:0;padding:.5rem .7rem;font:11px/1.5 ui-monospace,monospace;background:rgba(0,0,0,.78);color:#9effc9;border-radius:10px;pointer-events:none;white-space:pre';
    this.root.appendChild(box);
    var lb = el('button', 'mrs-lab-btn'); lb.type = 'button'; lb.textContent = T('🧪 اختبارٌ مفصّل', '🧪 Detailed test');
    lb.style.cssText = 'position:absolute;z-index:9;inset-block-start:.6rem;inset-inline-end:50%;padding:.3rem .7rem;border-radius:8px;border:0;background:rgba(0,0,0,.78);color:#9effc9;font:12px ui-monospace,monospace';
    lb.addEventListener('click', function () { self.lab(); });
    this.root.appendChild(lb);
    var mv = 0, raw = 0, lastTs = 0, lat = [], idle = 0;
    this.root.addEventListener('pointermove', function (e) { var c = e.getCoalescedEvents ? e.getCoalescedEvents() : []; mv++; ev += Math.max(1, c.length); lastTs = (c.length ? c[c.length - 1] : e).timeStamp; mx = Math.max(mx, e.pointerType === 'pen' ? 1 : 0); }, true);
    if ('onpointerrawupdate' in window) this.root.addEventListener('pointerrawupdate', function () { raw++; }, true);
    var back = 0, lt = 0, ltMax = 0;
    try { new PerformanceObserver(function (l) { l.getEntries().forEach(function (e) { lt += e.duration; ltMax = Math.max(ltMax, e.duration); }); }).observe({ entryTypes: ['longtask'] }); } catch (e) {}
    var timed = function (S) {
      if (!S || S._timed) return; S._timed = 1; S.gdiag = [];
      var pp = S.pump.bind(S), rr = S.render.bind(S);
      S.pump = function (b) { back = Math.max(back, S.q.length); return pp(b); };
      S.render = function (b) { var o = rr(b); if (lastTs) { lat.push(performance.now() - lastTs); lastTs = 0; } return o; };
    };
    var tick = function (now) {
      if (!self.S) return;
      timed(self.S);
      fr++; worst = Math.max(worst, now - last); last = now;
      if (!self.live) idle++;
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    this._diagT = setInterval(function () {
      if (!self.S || !box.isConnected || self._labRun) return;
      var c = self.gl, gms = self.S.gdiag || [], tq = self.S.tq;
      lat.sort(function (a, b) { return a - b; });
      box.textContent = 'gpu: ' + (self.gpu ? self.gpu.renderer : '?') + (self.gpu && self.gpu.soft ? '  [SOFTWARE]' : '') +
        '\ndpr: ' + (window.devicePixelRatio || 1) + ' -> ' + self.dpr() + '   view: ' + (c ? c.width + 'x' + c.height : '?') + '   doc: ' + self.W + 'x' + self.H +
        '\nfps: ' + fr + (idle === fr ? ' (idle)' : '') + '   worst frame: ' + Math.round(worst) + 'ms   input/s: ' + ev + (mx ? ' (pen)' : '') + ' · moves ' + mv + ' · raw ' + ('onpointerrawupdate' in window ? raw : 'n/a') +
        '\nin->frame: ' + (lat.length ? Math.round(lat[lat.length >> 1]) + 'ms median, ' + Math.round(lat[lat.length - 1]) + ' max' : '-') + (self.capped ? '   CAPPED outside page: ' + self.capped.fps + 'fps, gpu ' + self.capped.gpu + 'ms' : '') +
        '\nmain thread: long tasks ' + Math.round(lt) + 'ms/s, worst ' + Math.round(ltMax) + 'ms' +
        '\nredraw: ' + (self.S.stat && self.S.stat.n ? Math.round(self.S.stat.px / self.S.stat.n / 1000) + 'k px/frame, full ' + self.S.stat.full + '/' + self.S.stat.n : '-') + '   dabs/s: ' + (self.S.nDab || 0) +
        '\ngpu ms/frame: ' + (gms.length ? (gms.reduce(function (a, b) { return a + b; }, 0) / gms.length).toFixed(2) + ' avg, ' + Math.max.apply(null, gms).toFixed(1) + ' max' : (tq ? '-' : 'n/a')) + '   queue: ' + back +
        '\nundo: ' + (self.S.history ? (function (h) { return h.steps + ' steps, ' + (h.bytes / 1e6).toFixed(1) + 'MB' + (h.pending ? ', ' + h.pending + ' pending' : ''); })(self.S.history()) : '-') +
        '\ntier: ' + (self.perf ? self.perf.tier + ' · doc ' + self.W + ' · cap ' + self.dprCap + (self.perf.dab != null ? ' · bench dab ' + self.perf.dab + 'ms comp ' + self.perf.comp + 'ms' : '') : '-') + '\nua: ' + navigator.userAgent.replace(/^.*?\) /, '').slice(0, 60);
      fr = 0; worst = 0; ev = 0; lt = 0; ltMax = 0; self.S.stat = null; self.S.nDab = 0; self.S.gdiag = []; back = 0; mv = 0; raw = 0; lat = []; idle = 0;
    }, 1000);
  };
  Studio.prototype.lab = function () {
    var self = this;
    if (window.GardenMirsamLab) return GardenMirsamLab.run(this);
    var me = document.querySelector('script[src*="coloring.js"]'), s = document.createElement('script');
    s.src = me ? me.src.replace('coloring.js', 'mirsam-lab.js') : '/shared/mirsam-lab.js';
    s.onload = function () { GardenMirsamLab.run(self); };
    document.head.appendChild(s);
  };
  Studio.prototype.sizeKey = function () { return this.tool === 'fill' || this.tool === 'pick' ? this.medium : this.tool; };
  Studio.prototype.savePrefs = function () {
    store(PREF_KEY, { sizes: this.sizes, tool: this.tool, color: this.color, strength: this.strength, grade: this.grade, shade: this.shade, paper: this.paperKind, cat: this.cat, help: !!this.help, helpN: !!this.helpN, dockH: this.dockH || null, quality: this.quality });
  };

  Studio.prototype.paintChrome = function () {
    var en = lang() === 'en', self = this;
    this.root.setAttribute('dir', en ? 'ltr' : 'rtl');
    var lbl = function (sel, ar, e) { var b = self.$(sel); b.setAttribute('aria-label', en ? e : ar); b.dataset.arTitle = ar; b.dataset.enTitle = e; b.title = en ? e : ar; };
    lbl('.mrs-close', 'إغلاق المرسم', 'Close the studio');
    lbl('.mrs-undo', 'تراجع', 'Undo'); lbl('.mrs-redo', 'إعادة', 'Redo'); lbl('.mrs-wipe', 'امسحِ التلوين وابدأْ من جديد', 'Clear the coloring and start over');
    lbl('.mrs-zin', 'تكبير', 'Zoom in'); lbl('.mrs-zout', 'تصغير', 'Zoom out'); lbl('.mrs-fit', 'ملءُ الشاشة بالرسمة', 'Fit to screen');
    lbl('.mrs-more', 'نوعُ الورق', 'Paper type');
    lbl('.mrs-file', 'ملفّ: احفظْ أو صدّرْ أو افتحْ', 'File: save, export or open');
    lbl('.mrs-menu', 'المزيد: الثيمُ واللغةُ وأدواتٌ أخرى', 'More: theme, language and other tools');
    lbl('.mrs-grip', 'اسحبْ لتكبيرِ لوحِ الألوان أو تصغيره — واضغطْ لطيّه', 'Drag to resize the colors panel — tap to fold it');
    lbl('.mrs-hand', 'اليد: اسحبِ الرسمةَ لتتنقّل فيها (‏أو اضغطْ المسافة)', 'Hand: drag to move around (or hold Space)');
    this.$('.mrs-hand').setAttribute('aria-pressed', String(!!this.hand));
    lbl('.mrs-finger', 'الإصبعُ يرسم (‏أو يحرّك الرسمةَ فقط حين يُطفأ)', 'Finger draws (or only moves the drawing when off)');
    this.$('.mrs-finger').setAttribute('aria-pressed', String(this.palm() === 'never'));
    this.$('.mrs-plbl').textContent = T('اللمس', 'Touch');
    this.$('.mrs-penbtn span').textContent = T('أزرارُ القلم…', 'Pen buttons…');
    var pm = this.palm();
    this.root.querySelectorAll('.mrs-palms .mrs-chip').forEach(function (b) {
      var m = PALMS.filter(function (x) { return x[0] === b.dataset.palm; })[0];
      b.textContent = en ? m[2] : m[1]; b.setAttribute('aria-pressed', String(m[0] === pm));
    });
    this.$('.mrs-auto span').textContent = this._auto ? T('أوقِفِ التلوين', 'Stop coloring') : T('لوّنْها تلقائيّاً', 'Auto-color');
    this.$('.mrs-auto').setAttribute('aria-pressed', String(!!this._auto));
    this.paintGuide();
    lbl('.mrs-auto', 'لوّنْها تلقائيّاً بالأداة المختارة', 'Auto-color with the chosen tool');
    this.$('.mrs-auto').title = T('يلوّن الرسمةَ كالأصل بالأداة المختارة ثمّ يقيس المطابقة — ويمكن التراجع عنه', 'Colors the page like the original with the chosen tool, then measures the match — undoable');
    this.$('.mrs-auto').hidden = !this.hasRef || !!this.steps;
    lbl('.mrs-fold', this.root.classList.contains('is-folded') ? 'أظهرِ الألوان' : 'أخفِ الألوان', this.root.classList.contains('is-folded') ? 'Show colors' : 'Hide colors');
    this.$('.mrs-fold').setAttribute('aria-expanded', String(!this.root.classList.contains('is-folded')));
    this.$('.mrs-more').setAttribute('aria-expanded', String(!this.$('.mrs-opts').hidden));
    this.$('.mrs-zpct').setAttribute('aria-label', T('نسبةُ التكبير — اضغطْ للتبديل بين الحجم الحقيقيّ وملء الشاشة', 'Zoom — press to switch between actual size and fit'));
    this.$('.mrs-size').setAttribute('aria-label', T('حجمُ رأس الأداة', 'Tip size'));
    this.$('.mrs-str').setAttribute('aria-label', T('قوّةُ الضغط', 'Pressure strength'));
    this.$('.mrs-orig span').textContent = T('الأصل', 'Original');
    this.$('.mrs-orig').setAttribute('aria-pressed', String(!!this.orig));
    this.$('.mrs-orig').title = T('اعرضِ الرسمةَ الأصليّة ملوّنةً — واضغطْ مرّةً أخرى للعودة', 'Show the colored original — press again to return');
    this.$('.mrs-orig').hidden = !this.hasRef;
    this.$('.mrs-peek span').textContent = T('تعرض الأصل — اضغطْ للعودة إلى رسمك', 'Showing the original — press to return to yours');
    this.$('.mrs-insert .mrs-long').textContent = this.opts.insertLabel ? (en ? this.opts.insertLabel[1] : this.opts.insertLabel[0]) : T('أدرجْ في الصفحة', 'Insert into page');
    this.$('.mrs-insert .mrs-short').textContent = this.opts.insertLabel ? T('احفظْ', 'Save') : T('أدرجْ', 'Insert');
    lbl('.mrs-tip', 'حجمُ الرأس وقوّتُه', 'Tip size and strength');
    this.$('.mrs-title').textContent = this.title || T('المرسم', 'Studio');
    this.$('.mrs-lock').setAttribute('aria-pressed', String(this.lock));
    this.$('.mrs-lock span').textContent = T('داخلَ الخطوط', 'Inside lines');
    this.$('.mrs-lock').title = T('اللونُ لا يتجاوز حدودَ الشكل الذي بدأتَ منه', 'Color stays inside the shape you start in');
    this.$('.mrs-shade').setAttribute('aria-pressed', String(this.shade));
    this.$('.mrs-shade span').textContent = T('تظليل', 'Shading');
    this.$('.mrs-shade').title = T('الدلوُ يترك ضوءاً وظلّاً كما يفعل الرسّام', 'The bucket leaves light and shadow like an artist');
    this.$('.mrs-shade').hidden = this.tool !== 'fill';
    this.$('.mrs-olbl').textContent = T('الورق', 'Paper');
    this.$('.mrs-qlbl').textContent = T('الجودة', 'Quality');
    this.root.querySelectorAll('.mrs-quals .mrs-chip').forEach(function (b) {
      var q = QUALS.filter(function (x) { return x[0] === b.dataset.q; })[0];
      b.textContent = (en ? q[2] : q[1]) + (q[0] === 'auto' && self.perf && self.quality === 'auto' ? ' · ' + (QUALS.filter(function (x) { return x[0] === self.perf.tier; })[0] || q)[en ? 2 : 1] : '');
      b.setAttribute('aria-pressed', String(q[0] === self.quality));
    });
    this.root.querySelectorAll('.mrs-papers .mrs-chip').forEach(function (b) {
      var p = PAPERS.filter(function (x) { return x[0] === b.dataset.paper; })[0];
      b.textContent = en ? p[2] : p[1]; b.setAttribute('aria-pressed', String(p[0] === self.paperKind));
    });
    this.root.querySelectorAll('.mrs-rk').forEach(function (h) { var g = GROUPS[h.dataset.grp]; h.textContent = g ? (en ? g[1] : g[0]) : ''; });
    this.root.querySelectorAll('.mrs-tool').forEach(function (b) {
      var t = BYID[b.dataset.tool], name = en ? t.en : t.ar, k = (t.key || '').toUpperCase();
      b.querySelector('.mrs-tl').textContent = name;
      var gg = GROUPS[t.grp]; b.setAttribute('aria-label', name + (k ? ' (' + k + ')' : '')); b.title = name + (k ? ' — ' + k : '') + (gg ? ' · ' + (en ? gg[1] : gg[0]) : '');
      b.dataset.arTitle = t.ar; b.dataset.enTitle = t.en;
      b.setAttribute('aria-pressed', String(t.id === self.tool));
    });
    this.$('.mrs-undo').disabled = !(this.S && this.S.canUndo());
    this.$('.mrs-redo').disabled = !(this.S && this.S.canRedo());
    this.paintZoom();
  };

  Studio.prototype.paintGuide = function () {
    var t = BYID[this.tool]; if (!t || !this.$('.mrs-now')) return;
    var e = lang() === 'en', g = GUIDE[t.id] || {}, k = (t.key || '').toUpperCase();
    this.$('.mrs-now-i').innerHTML = '<i class="fa-solid ' + (g.i || 'fa-pen') + '"></i>';
    this.$('.mrs-now-n').textContent = e ? t.en : t.ar;
    this.$('.mrs-now-k').textContent = k; this.$('.mrs-now-k').hidden = !k;
    var hb = this.$('.mrs-help');
    hb.querySelector('span').textContent = this.helpOn() ? T('أخفِ الشرح', 'Hide guide') : T('اشرحْ لي', 'Explain');
    hb.setAttribute('aria-pressed', String(this.helpOn()));
    var box = this.$('.mrs-guide');
    box.hidden = !this.helpOn() || !g.w;
    if (box.hidden) return;
    var L = function (x) { return x ? (e ? x[1] : x[0]) : ''; };
    var row = function (ic, h, x) { return x ? '<p><i class="fa-solid ' + ic + '" aria-hidden="true"></i><b>' + h + '</b> ' + L(x).replace(/[<>&]/g, '') + '</p>' : ''; };
    var mo = MORE[t.id] || {};
    box.innerHTML = '<p class="mrs-g-what">' + L(g.w).replace(/[<>&]/g, '') + '</p>' +
      '<div class="mrs-g-tags">' + (mo.k ? '<span class="mrs-g-k">' + L(mo.k).replace(/[<>&]/g, '') + '</span>' : '') + (g.p ? g.p.map(function (x) { return '<span>' + L(x) + '</span>'; }).join('') : '') + '</div>' +
      row('fa-bullseye', T('متى تستعملها:', 'Use it for:'), g.u) +
      row('fa-hand-pointer', T('كيف:', 'How:'), g.h) +
      row('fa-pen-nib', T('الضغطُ والإمالة:', 'Pressure & tilt:'), mo.g) +
      row('fa-lightbulb', T('نصيحةُ رسّام:', 'Artist tip:'), g.t) +
      row('fa-triangle-exclamation', T('خطأٌ شائع:', 'Common mistake:'), mo.x) +
      row('fa-link', T('يتناغم مع:', 'Pairs well with:'), mo.m) +
      '<button type="button" class="gsf-btn gsf-btn--sm gsf-btn--ghost mrs-g-book"><i class="fa-solid fa-book-open" aria-hidden="true"></i><span>' + T('دليلُ الرسّام: من أين أبدأ؟', 'Artist’s guide: where to start?') + '</span></button>';
    var self = this; box.querySelector('.mrs-g-book').addEventListener('click', function () { self.book(true); });
  };

  Studio.prototype.book = function (on) {
    var bx = this.$('.mrs-book'), self = this;
    if (!on) { if (bx) bx.hidden = true; return; }
    if (!bx) { bx = el('section', 'mrs-book'); bx.setAttribute('role', 'dialog'); this.root.appendChild(bx); }
    var e = lang() === 'en', L = function (x) { return (e ? x[1] : x[0]).replace(/[<>&]/g, ''); };
    bx.setAttribute('aria-label', T('دليلُ الرسّام', 'Artist’s guide'));
    bx.innerHTML = '<header><i class="fa-solid fa-book-open" aria-hidden="true"></i><h3>' + T('دليلُ الرسّام', 'Artist’s guide') + '</h3><span class="mrs-sp"></span>' +
      '<button type="button" class="mrs-ib mrs-book-x" aria-label="' + T('أغلقِ الدليل', 'Close the guide') + '"><i class="fa-solid fa-xmark" aria-hidden="true"></i></button></header>' +
      BOOK.map(function (sec, i) {
        return '<details' + (i === 0 ? ' open' : '') + '><summary><i class="fa-solid ' + sec[0] + '" aria-hidden="true"></i>' + L(sec[1]) + '</summary><ol>' +
          sec[2].map(function (x) { return '<li>' + L(x) + '</li>'; }).join('') + '</ol></details>';
      }).join('');
    bx.hidden = false;
    bx.querySelector('.mrs-book-x').addEventListener('click', function () { self.book(false); });
    bx.querySelector('summary').focus();
  };

  Studio.prototype.toast = function (msg) {
    var t = this.$('.mrs-toast'); t.textContent = msg; t.hidden = false;
    clearTimeout(this._tt); this._tt = setTimeout(function () { t.hidden = true; }, 2600);
  };

  Studio.prototype.setTool = function (id, quiet) {
    var t = BYID[id]; if (!t) return;
    this.tool = id;
    if (t.eng) this.medium = id;
    this.root.dataset.tool = id;
    var key = this.sizeKey(), sz = this.sizes[key];
    this.$('.mrs-size').value = sz == null ? (BYID[key].def || .35) : sz;
    this.$('.mrs-str').value = this.strength;
    this.$('.mrs-side').classList.toggle('is-off', id === 'pick');
    if (!quiet) this.savePrefs();
    if (t.set && (this.cat === 'set' || this.cat === 'grade')) this.cat = t.id === 'graphite' ? 'grade' : 'set';
    if (id !== 'graphite' && this.cat === 'grade') this.cat = 'set';
    if (id === 'graphite' && this.cat === 'set') this.cat = 'grade';
    this.paintChrome(); this.paintPalette(); this.paintTip();
    if (this.S && this.S.prepare) this.S.prepare(this.medium, id === 'fill');
  };

  Studio.prototype.setColor = function (hex, fromUser) {
    if (!/^#[0-9a-f]{6}$/i.test(hex)) return;
    this.color = hex.toLowerCase();
    this.root.style.setProperty('--c', this.color);
    if (fromUser) { this._pickedColor = true; this.savePrefs(); }
    var self = this;
    this.root.querySelectorAll('.mrs-c[data-c]').forEach(function (b) { b.setAttribute('aria-pressed', String(b.dataset.c === self.color)); });
    this.$('.mrs-cname').textContent = this.colorName(this.color);
    this.paintShades(); this.paintTip();
  };

  Studio.prototype.colorName = function (hex) {
    var en = lang() === 'en', hit = null;
    Object.keys(SETS).some(function (k) { return SETS[k].c.some(function (c) { if (c[0] === hex) { hit = en ? c[2] : c[1]; return true; } return false; }); });
    if (hit) return hit;
    var v = hexRgb(hex), L = toLab(v[0], v[1], v[2]), C = Math.hypot(L[1], L[2]), H = (Math.atan2(L[2], L[1]) * 180 / Math.PI + 360) % 360;
    var fam = C < .035 ? BASIC[BASIC.length - 1] : BASIC.slice(0, 12).reduce(function (b, f, i) { var d = Math.abs(((FAMILIES[i][3] - H + 540) % 360) - 180); return !b || d < b.d ? { f: f, d: d } : b; }, null).f;
    var tone = L[0] > .78 ? T('فاتح', 'light ') : L[0] < .42 ? T('داكن', 'dark ') : '';
    return en ? (tone + fam.en.toLowerCase()) : (fam.ar + (tone ? ' ' + tone : ''));
  };

  Studio.prototype.addRecent = function (hex) {
    if (this.recent[0] === hex) return;
    this.recent = [hex].concat(this.recent.filter(function (h) { return h !== hex; })).slice(0, 14);
    store(RECENT_KEY, this.recent);
    if (this.cat === 'recent') this.paintPalette();
  };

  Studio.prototype.tabs = function () {
    var t = BYID[this.tool], set = t.set || BYID[this.medium].set, out = [];
    if (this.families && this.families.length) out.push(['orig', 'من الرسمة', 'From the drawing']);
    if (this.tool === 'graphite') out.push(['grade', 'درجاتُ الرصاص', 'Graphite grades']);
    else {
      out.push(['basic', 'الأساسيّة', 'Basic']);
      if (set && SETS[set]) out.push(['set', SETS[set].ar, SETS[set].en]);
    }
    out.push(['recent', 'المستعملة', 'Recent']);
    return out;
  };

  Studio.prototype.paintPalette = function () {
    var self = this, en = lang() === 'en', tabs = this.tabs(), box = this.$('.mrs-tabs');
    if (!tabs.some(function (t) { return t[0] === self.cat; })) this.cat = tabs[0][0];
    box.innerHTML = tabs.map(function (t) {
      return '<button type="button" role="tab" class="mrs-tab" data-cat="' + t[0] + '" aria-selected="' + (t[0] === self.cat) + '">' + esc(en ? t[2] : t[1]) + '</button>';
    }).join('');
    box.querySelectorAll('.mrs-tab').forEach(function (b) { b.addEventListener('click', function () { self.cat = b.dataset.cat; self._pickedCat = true; self.savePrefs(); self.paintPalette(); }); });
    var sw = this.$('.mrs-sw'); sw.textContent = ''; sw.dataset.cat = this.cat;
    var chip = function (hex, name, cls) {
      var b = el('button', 'mrs-c' + (cls ? ' ' + cls : '')); b.type = 'button'; b.dataset.c = hex.toLowerCase();
      b.style.setProperty('--sw', hex); b.setAttribute('aria-label', name); b.title = name;
      b.setAttribute('aria-pressed', String(b.dataset.c === self.color));
      return b;
    };
    if (this.cat === 'orig') {
      this.families.forEach(function (f, i) {
        var col = el('div', 'mrs-fam');
        f.shades.forEach(function (h, j) { col.appendChild(chip(h, T('لونٌ من الرسمة ', 'Drawing color ') + (i + 1) + ' — ' + T('درجة ', 'shade ') + (j + 1) + '/' + f.shades.length)); });
        sw.appendChild(col);
      });
    } else if (this.cat === 'basic') {
      BASIC.forEach(function (f) {
        var col = el('div', 'mrs-fam');
        f.shades.forEach(function (h, j) { col.appendChild(chip(h, (en ? f.en : f.ar) + ' — ' + T('درجة ', 'shade ') + (j + 1) + '/' + f.shades.length)); });
        sw.appendChild(col);
      });
    } else if (this.cat === 'set') {
      var set = SETS[BYID[this.tool].set || BYID[this.medium].set] || SETS.pencil;
      var grid = el('div', 'mrs-grid');
      set.c.forEach(function (c) { grid.appendChild(chip(c[0], en ? c[2] : c[1])); });
      sw.appendChild(grid);
    } else if (this.cat === 'grade') {
      var g = el('div', 'mrs-grades');
      GRADES.forEach(function (gr) {
        var b = el('button', 'mrs-grade'); b.type = 'button'; b.textContent = gr[0];
        b.style.setProperty('--g', gr[1]);
        b.setAttribute('aria-pressed', String(Math.abs(gr[1] - self.grade) < .01));
        b.setAttribute('aria-label', T('درجة الرصاص ', 'Graphite grade ') + gr[0]);
        b.addEventListener('click', function () { self.grade = gr[1]; self.savePrefs(); self.paintPalette(); });
        g.appendChild(b);
      });
      sw.appendChild(g);
    } else {
      var rg = el('div', 'mrs-grid');
      if (!this.recent.length) rg.innerHTML = '<p class="mrs-empty">' + esc(T('الألوانُ التي تستعملها تظهر هنا.', 'Colors you use appear here.')) + '</p>';
      this.recent.forEach(function (h) { rg.appendChild(chip(h, T('لونٌ استعملتَه: ', 'Recent: ') + self.colorName(h))); });
      sw.appendChild(rg);
    }
    var pick = el('label', 'mrs-c mrs-custom');
    pick.innerHTML = '<input type="color" value="' + this.color + '"><i class="fa-solid fa-plus" aria-hidden="true"></i>';
    pick.querySelector('input').setAttribute('aria-label', T('لونٌ من اختيارك', 'Custom color'));
    pick.querySelector('input').addEventListener('input', function (e) { self.setColor(e.target.value, true); });
    if (this.cat !== 'grade') sw.appendChild(pick);
    sw.querySelectorAll('.mrs-c[data-c]').forEach(function (b) { b.addEventListener('click', function () { self.setColor(b.dataset.c, true); }); });
    this.setColor(this.color);
  };

  Studio.prototype.paintShades = function () {
    var self = this, row = this.$('.mrs-shades');
    if (this.cat === 'grade') { row.hidden = true; return; }
    row.hidden = false; row.textContent = '';
    row.setAttribute('aria-label', T('درجاتُ اللون الحاليّ', 'Shades of the current color'));
    rampOf(this.color, 11).forEach(function (h, i) {
      var b = el('button', 'mrs-sh'); b.type = 'button'; b.style.setProperty('--sw', h); b.dataset.c = h;
      b.setAttribute('aria-label', T('درجة ', 'Shade ') + (i + 1) + ' / 11'); b.title = h;
      b.addEventListener('click', function () { self.setColor(h, true); });
      row.appendChild(b);
    });
  };

  Studio.prototype.radius = function (tool) {
    var t = BYID[tool || this.tool]; if (!t || !t.size) return 4;
    var v = this.sizes[t.id]; if (v == null) v = t.def;
    return (t.size[0] + (t.size[1] - t.size[0]) * v * v) * (this.W || 2048) / 2048;
  };

  Studio.prototype.paintTip = function () {
    var tip = this.$('.mrs-tip span'), key = this.sizeKey(), r = this.radius(key) * (this.view.s || 1);
    var d = clamp(r * 2, 3, 64);
    tip.style.inlineSize = tip.style.blockSize = d + 'px';
    tip.style.opacity = String(.35 + .65 * this.strength);
    tip.dataset.shape = key === 'marker' ? 'chisel' : 'round';
  };

  Studio.prototype.load = function (item) {
    var self = this;
    if (item.project) {
      var ph = item.project.head, pp = item.project.parts;
      (this._pjUrls || []).forEach(function (u) { URL.revokeObjectURL(u); }); this._pjUrls = [];
      var mk = function (b) { if (!b) return null; var u = URL.createObjectURL(b); self._pjUrls.push(u); return u; };
      item = { lineUrl: pp.line ? mk(pp.line) : libUrl(ph.item && ph.item.line), refUrl: pp.ref ? mk(pp.ref) : libUrl(ph.item && ph.item.color), W: ph.W, H: ph.H, paper: pp.state ? ph.paper : (ph.paper0 || ph.paper), id: ph.item && ph.item.id, title: item.title || ph.title,
        project: item.project, srcLine: libUrl(ph.item && ph.item.line), srcRef: libUrl(ph.item && ph.item.color) };
    }
    this.item = item;
    this.title = item.title || '';
    this.root.classList.add('is-busy');
    var perf = this.quality === 'auto' ? autoTier() : { tier: this.quality, cap: TIERS[this.quality].cap };
    this.perf = perf; this.dprCap = perf.cap;
    var side = item.side || TIERS[perf.tier].doc;
    if (item.W && item.H && Math.max(item.W, item.H) > side) { var k0 = side / Math.max(item.W, item.H); item = Object.assign({}, item, { W: Math.round(item.W * k0), H: Math.round(item.H * k0) }); }
    var lineP, refP;
    if (item.svg) {
      this.refSvg = withStyle(item.svg, HIDE_GUIDE);
      lineP = svgImage(withStyle(item.svg, HIDE_COLOR), side, side);
      refP = svgImage(this.refSvg, side, side).catch(function () { return null; });
    } else {
      lineP = rasterImage(item.lineUrl);
      refP = item.refUrl ? rasterImage(item.refUrl).catch(function () { return null; }) : Promise.resolve(null);
    }
    var paintP = item.paintUrl ? rasterImage(item.paintUrl).catch(function () { return null; }) : Promise.resolve(null);
    var tok = this._tok = (this._tok || 0) + 1;
    this.hasRef = false; this.refImg = null; this._refC = null; this.families = null; this.regions = null;
    var pre = !item.svg && PRE && PRE.url === item.lineUrl && PRE.side === side ? PRE : null;
    if (pre) { var lp0 = lineP; lineP = pre.p.then(function (p) { return p.img; }, function () { return lp0; }); }
    var preRef = pre && pre.refP && pre.ref === item.refUrl ? pre : null;
    if (preRef) refP = preRef.refP;
    return Promise.all([lineP, paintP]).then(function (r) {
      var img = r[0], paint = r[1];
      var sz = docSize(item, side, img), W = sz.W, H = sz.H;
      self.W = W; self.H = H;
      var hit = pre && pre.line && pre.W === W && pre.H === H;
      var line = hit ? pre.line : lineOf(img, W, H);
      self.lineCanvas = line;
      self.initGL(W, H, item.paper);
      self.S.setLines(line, 1);
      if (paint) self.S.loadPaint(paint);
      self._recipe = null;
      if (item.project && self.S.restore) {
        var ph2 = item.project.head, pp2 = item.project.parts, ops0 = null;
        try { ops0 = pp2.rec ? GardenPaintGL.decodeLog(new Uint8Array(pp2.rec)) : null; } catch (e) { ops0 = null; }
        if (pp2.state) {
          self.S.restore({ W: W, H: H, fmt: ph2.fmt, paper: ph2.paper, state: pp2.state, hist: pp2.hist });
          self.S.log = ops0; self.S.paper0 = ph2.paper0 || ph2.paper;
          if (ops0) self.S.logN = ops0.reduce(function (m, o) { return o[0] === 'B' ? Math.max(m, o[1]) : m; }, 0);
        } else if (ops0) self._recipe = { ops: ops0, engine: ph2.engine };
      }
      self.regionsP = (hit ? pre.regionsP : Regions.build(line, Math.max(2, Math.round(W / (item.svg ? 300 : 460))), img)).then(function (g) {
        if (self._tok === tok && self.S) self.regions = g;
        if (g.ordP) g.ordP.then(function (R) { var S = self.S; if (self._tok === tok && S && S.setOrder && S._ordR !== R) { S.setOrder(R.ord); S._ordR = R; } });
        return g;
      });
      var cat = self.cat;
      self.root.classList.remove('is-busy');
      self.paintChrome(); self.paintPalette();
      self.cat = cat;
      self.layout(true);
      self.kick();
      self.checkGpu();
      if (self.opts.onReady) self.opts.onReady(self);
      self.refP = refP.then(function (ref) {
        if (self._tok !== tok || !self.S) return null;
        if (ref) {
          ref.__tag = 'ref'; self.S.setRef(ref); self.hasRef = true; self.refImg = ref; if (self.S.prepare) self.S.prepare(self.medium, self.tool === 'fill');
          try { self.families = preRef && preRef.fam ? preRef.fam : extractFamilies(ref); } catch (e) { self.families = null; }
        }
        if (!self.families || !self.families.length) { self.families = null; if (self.cat === 'orig') self.cat = 'basic'; }
        else if (self.tool !== 'graphite' && !self._pickedCat) self.cat = 'orig';
        if (self.families && !self._pickedColor && self.tool !== 'graphite') {
          var lead = self.families.filter(function (f) { var c = hexRgb(f.shades[f.shades.length >> 1]); return Math.max(c[0], c[1], c[2]) - Math.min(c[0], c[1], c[2]) > 40; })[0] || self.families[0];
          self.color = lead.shades[lead.shades.length >> 1].toLowerCase();
        }
        self.paintChrome(); self.paintPalette(); self.kick();
        if (ref && self.opts.onRef) self.opts.onRef(self);
        return ref;
      });
      if (self._recipe) self.rebuild(self._recipe, tok);
      return self;
    }, function (e) { self.root.classList.remove('is-busy'); throw e; });
  };

  Studio.prototype.rebuild = function (rc, tok) {
    var self = this, ops = rc.ops, S = this.S;
    var needOrd = ops.some(function (o) { return o[0] === 'R'; }), needRef = needOrd || ops.some(function (o) { return o[0] === 'P' || o[0] === 'L'; });
    this._replaying = true; this.rebuildUI(0);
    var live = function () { return self._tok === tok && self.S === S; };
    return Promise.all([this.regionsP, needRef ? this.refP : null]).then(function (r) {
      var R = r[0];
      return needOrd && R && R.ordP ? R.ordP : R;
    }).then(function (R) {
      if (!live()) return;
      if (needOrd && R && R.ord && S._ordR !== R) { S.setOrder(R.ord); S._ordR = R; }
      return S.replay(ops, { mask: function (L) { return self.regions.mask(L); }, img: function () { return self.refImg; }, progress: function (f) { if (live()) self.rebuildUI(f); } });
    }).then(function () {
      if (!live()) return;
      self._replaying = false; self.rebuildUI(null);
      self.paintChrome(); self.kick();
      if (rc.engine && rc.engine !== GardenPaintGL.ENGINE) self.toast(T('أُعيد تركيبُ الرسمة بمحرّكٍ أحدث من الذي رُسمت به — قد تختلف الخامةُ اختلافاً طفيفاً.', 'Rebuilt with a newer engine than it was drawn with — textures may differ slightly.'));
    }, function () {
      if (!live()) return;
      self._replaying = false; self.rebuildUI(null); self.paintChrome(); self.kick();
      self.toast(T('تعذّرت إعادةُ تركيب الرسمة كاملةً.', 'The drawing could not be fully rebuilt.'));
    });
  };
  Studio.prototype.rebuildUI = function (f) {
    var box = this.$('.mrs-rebuild'); if (!box) return;
    if (f == null) { box.hidden = true; this.root.classList.remove('is-rebuild'); return; }
    box.hidden = false; this.root.classList.add('is-rebuild');
    box.querySelector('b').textContent = T('نعيد تركيبَ رسمتك… ', 'Rebuilding your drawing… ') + Math.round(f * 100) + T('٪', '%');
    box.querySelector('i').style.inlineSize = (f * 100).toFixed(1) + '%';
    box.querySelector('small').textContent = T('حُفظت بأصغر حجمٍ ممكن، وتُبنى الآن على جهازك من جديد بكلِّ تفاصيلها وتراجعها.', 'It was saved as small as possible and is now rebuilt on your device with every detail and its undo.');
  };

  Studio.prototype.initGL = function (W, H, paper) {
    if (paper) this.paperKind = paper;
    if (this.S) { this.S.destroy(); this.S = null; }
    var old = this.$('.mrs-gl');
    this.S = GardenPaintGL.create(el('canvas', 'mrs-gl'), { W: W, H: H, paper: this.paperKind, shared: true, queue: true });
    var fresh = this.S.canvas; fresh.className = 'mrs-gl'; fresh.removeAttribute('style');
    if (old !== fresh) old.parentNode.replaceChild(fresh, old);
    this.gl = fresh;
    var cs = getComputedStyle(this.root), bg = cs.getPropertyValue('--mrs-desk').trim() || '#1c2029';
    var d = hexRgb(/^#[0-9a-f]{6}$/i.test(bg) ? bg : '#1c2029');
    this.S.setDesk([d[0] / 255, d[1] / 255, d[2] / 255]);
    this.S.setFlat(!!(this.perf && this.perf.tier === 'low'));
    if (this.S.prepare) this.S.prepare(this.medium, this.tool === 'fill');
    if (this.router) { this.router.destroy(); this.router = null; }
    this.bindRouter();
  };

  Studio.prototype.lesson = function (item) {
    var self = this, svg = item.svg;
    var n = 0; svg.replace(/data-step="(\d+)"/g, function (m, k) { n = Math.max(n, +k); return m; });
    this.steps = n; this.stepAt = 1; this.mode = 'lesson';
    this.root.classList.add('is-lesson');
    var bar = this.$('.mrs-lesson');
    bar.hidden = false;
    bar.innerHTML = '<button type="button" class="gsf-btn gsf-btn--sm mrs-prev"><i class="fa-solid fa-rotate-left" aria-hidden="true"></i><span></span></button>' +
      '<output></output><button type="button" class="gsf-btn gsf-btn--go gsf-btn--sm mrs-next"><span></span></button>' +
      '<button type="button" class="gsf-btn gsf-btn--ghost gsf-btn--sm mrs-tpl" aria-pressed="true"><i class="fa-solid fa-eye" aria-hidden="true"></i><span></span></button>';
    bar.querySelector('.mrs-prev').addEventListener('click', function () { self.goStep(self.stepAt - 1); });
    bar.querySelector('.mrs-next').addEventListener('click', function () { self.goStep(self.stepAt + 1); });
    bar.querySelector('.mrs-tpl').addEventListener('click', function (e) {
      var b = e.currentTarget, on = b.getAttribute('aria-pressed') !== 'true';
      b.setAttribute('aria-pressed', String(on)); self.S.setGuide(null, on ? .9 : 0); self.kick();
    });
    return this.load({ svg: svg, title: item.title }).then(function () {
      self.S.setLines(null);
      self.lock = false; self.setTool('graphite');
      return self.goStep(1);
    });
  };

  Studio.prototype.goStep = function (k) {
    if (!this.steps) return Promise.resolve();
    k = Math.max(1, Math.min(this.steps, k)); this.stepAt = k;
    var css = '#color,#hair,#skin,#skin-shadow{display:none}#guide{display:inline!important;opacity:' + (k === 1 ? .9 : .45) + '}' +
      '#line [data-step]{opacity:.45}#line [data-step="' + k + '"]{opacity:1}#line [data-step="' + k + '"] *{stroke:#2563eb}';
    for (var j = k + 1; j <= this.steps; j++) css += '#line [data-step="' + j + '"]{display:none}';
    var self = this, bar = this.$('.mrs-lesson');
    bar.querySelector('output').textContent = T('الخطوة ', 'Step ') + k + ' / ' + this.steps;
    bar.querySelector('.mrs-prev').disabled = k === 1;
    bar.querySelector('.mrs-next span').textContent = k === this.steps ? T('قارنْ رسمي', 'Compare') : T('الخطوةُ التالية', 'Next step');
    bar.querySelector('.mrs-prev span').textContent = T('السابقة', 'Back');
    bar.querySelector('.mrs-tpl span').textContent = T('القالب', 'Guide');
    if (k === this.steps && this._lastStep === k) this.setOrig(!this.orig);
    this._lastStep = k;
    return svgImage(withStyle(this.item.svg, '<style>' + css + '</style>'), this.W, this.H).then(function (img) {
      var c = canvas(self.W, self.H); ctx2(c).drawImage(img, 0, 0, self.W, self.H);
      self.S.setGuide(c, .9); self.kick();
    });
  };

  Studio.prototype.setPaper = function (k) {
    this.paperKind = k;
    if (this.S && !this._replaying) { this.S.setPaper(k); this.kick(); }
    this.savePrefs(); this.paintChrome();
  };

  Studio.prototype.setHand = function (on) {
    this.hand = !!on;
    this.root.classList.toggle('is-pan', this.hand || !!this.panKey);
    this.paintChrome();
  };

  Studio.prototype.match = function () {
    if (!this.S || !this.refImg) return null;
    var w = Math.round(this.W / 4), h = Math.round(this.H / 4), M = this._mref;
    if (!M || M.img !== this.refImg || M.w !== w) {
      var b = canvas(w, h), bx = ctx2(b, true); bx.fillStyle = '#fff'; bx.fillRect(0, 0, w, h); bx.drawImage(this.refImg, 0, 0, w, h);
      var lm = canvas(w, h), lx = ctx2(lm, true); lx.drawImage(this.lineCanvas, 0, 0, w, h);
      var dl0 = lx.getImageData(0, 0, w, h).data, db0 = bx.getImageData(0, 0, w, h).data, lab0 = [];
      for (var j = 0; j < db0.length; j += 4) lab0.push(dl0[j] < 215 ? null : toLab(db0[j], db0[j + 1], db0[j + 2]));
      M = this._mref = { img: this.refImg, w: w, lab: lab0 };
    }
    var a = this.S.exportCanvas({ scale: .25, lines: true, paper: true });
    var da = ctx2(a, true).getImageData(0, 0, w, h).data, n = 0, ok = 0, sum = 0;
    for (var i = 0; i < da.length; i += 4) {
      var q = M.lab[i >> 2]; if (!q) continue;
      var p = toLab(da[i], da[i + 1], da[i + 2]);
      var e = Math.hypot(p[0] - q[0], p[1] - q[1], p[2] - q[2]); sum += e; n++; if (e < .05) ok++;
    }
    return { pct: Math.round(ok / n * 1000) / 10, mean: Math.round(sum / n * 1000) / 1000 };
  };

  Studio.prototype.autoPaint = function (opt) {
    opt = opt || {};
    if (this._auto) { this._autoStop = true; return this._autoP; }
    if (!this.S || !this.hasRef || this._replaying) return Promise.resolve(null);
    var self = this, S = this.S, med = BYID[this.medium] && BYID[this.medium].eng || 'pencil';
    if (med === 'eraser' || med === 'blend') med = 'pencil';
    var passes = S.refPasses ? S.refPasses(med) : 1, dur = opt.ms == null ? 3500 : opt.ms;
    this._auto = true; this._autoStop = false;
    this.root.classList.add('is-auto');
    this.paintChrome();
    this._autoP = (this.regions ? Promise.resolve(this.regions) : (this.regionsP || Promise.resolve(null))).then(function (R) {
      return R && R.ordP && S.refRank ? R.ordP : R;
    }).then(function (R) {
      return new Promise(function (res) {
        var ok = !!(R && R.ord && S.refRank), last = ok ? R.n + 1 : 0, cum = new Float64Array(last + 1), r0 = 1, t0 = 0;
        if (ok) { for (var k = 1; k <= last; k++) cum[k] = cum[k - 1] + R.area[k]; if (S._ordR !== R) { S.setOrder(R.ord); S._ordR = R; } }
        S.group(true);
        var done = function () {
          var live = self.S === S, stop = self._autoStop;
          if (live) {
            if (!ok) { try { S.paintRef(med); } catch (e) {} }
            S.group(false); self.changed++; S.render();
          }
          self._auto = false;
          self.root.classList.remove('is-auto'); self.root.style.removeProperty('--auto');
          if (live) { self.paintChrome(); self.kick(); }
          setTimeout(function () {
            var m = null;
            if (live && !stop && self.S === S) { try { m = self.match(); } catch (e) {} }
            self.lastMatch = m;
            if (m) self.toast(T('لُوّنت ب', 'Colored with ') + (lang() === 'en' ? BYID[self.medium].en : BYID[self.medium].ar) + T(' — مطابقةُ الأصل: ', ' — match with the original: ') + m.pct + '%');
            res(m);
          }, 60);
        };
        if (!ok || !cum[last]) { done(); return; }
        var queue = [], budget = 1 << 17, prev = 0, base = 1e9;
        var step = function (now) {
          if (self.S !== S || self._autoStop) { done(); return; }
          if (!t0) t0 = now;
          if (prev) { var gap = now - prev, ex; base = Math.min(base * 1.03, gap); ex = gap - base; budget = ex > 14 ? Math.max(1 << 13, budget * .65 | 0) : ex < 7 ? Math.min(1 << 22, budget * 1.3 | 0) : budget; }
          prev = now;
          if (r0 <= last) {
            var target = dur ? cum[last] * Math.min(1, (now - t0) / dur) : cum[last], r1 = r0 + 1;
            while (r1 <= last && cum[r1 - 1] < target) r1++;
            var b = R.rbox, x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1;
            for (var q = r0; q < r1; q++) { var o = q * 4; if (b[o + 2] < 0) continue; x0 = Math.min(x0, b[o]); y0 = Math.min(y0, b[o + 1]); x1 = Math.max(x1, b[o + 2]); y1 = Math.max(y1, b[o + 3]); }
            if (x1 >= 0) queue.push([r0, r1, x0, y0, x1 - x0 + 1, y1 - y0 + 1]);
            r0 = r1;
          }
          var left = budget;
          while (queue.length && left > 0) {
            var c = queue[0], rows = Math.max(8, Math.floor(left / c[4]));
            if (rows >= c[5]) { queue.shift(); S.refRank(med, c[0], c[1], [c[2], c[3], c[4], c[5]], passes); left -= c[4] * c[5]; }
            else { S.refRank(med, c[0], c[1], [c[2], c[3], c[4], rows], passes); c[3] += rows; c[5] -= rows; left = 0; }
          }
          self.root.style.setProperty('--auto', (cum[r0 - 1] / cum[last]).toFixed(3));
          self.kick();
          if (r0 <= last || queue.length) requestAnimationFrame(step); else done();
        };
        requestAnimationFrame(step);
      });
    });
    return this._autoP;
  };

  Studio.prototype.setOrig = function (on) {
    if (!this.hasRef) on = false;
    this.orig = !!on;
    if (this.S) this.S.setRefMix(this.orig ? 1 : 0);
    this.$('.mrs-peek').hidden = !this.orig;
    this.root.classList.toggle('is-orig', this.orig);
    this.paintChrome(); this.kick();
  };

  Studio.prototype.area = function () {
    var r = this.root.getBoundingClientRect(), self = this, pad = 10;
    var x0 = r.left, x1 = r.right, y0 = r.top, y1 = r.bottom, narrow = this.root.classList.contains('is-narrow');
    ['.mrs-top', '.mrs-lesson', '.mrs-dock', '.mrs-rack', '.mrs-side'].forEach(function (s) {
      var e = self.$(s); if (!e || e.hidden || !e.getClientRects().length) return;
      var b = e.getBoundingClientRect(); if (!b.width || !b.height) return;
      if (s === '.mrs-side' && narrow) return;
      if (b.right <= x0 || b.left >= x1 || b.bottom <= y0 || b.top >= y1) return;
      var cuts = [[x0, Math.max(y0, b.bottom), x1, y1], [x0, y0, x1, Math.min(y1, b.top)], [Math.max(x0, b.right), y0, x1, y1], [x0, y0, Math.min(x1, b.left), y1]];
      var best = cuts[0], ba = -1;
      cuts.forEach(function (c) { var ar = Math.max(0, c[2] - c[0]) * Math.max(0, c[3] - c[1]); if (ar > ba) { ba = ar; best = c; } });
      x0 = best[0]; y0 = best[1]; x1 = best[2]; y1 = best[3];
    });
    return { x: x0 - r.left + pad, y: y0 - r.top + pad, w: Math.max(80, x1 - x0 - pad * 2), h: Math.max(80, y1 - y0 - pad * 2) };
  };

  Studio.prototype.layout = function (refit) {
    var r = this.root.getBoundingClientRect();
    if (!r.width || !r.height) return;
    var narrow = r.width <= 640 || (r.height <= 480 && r.width < r.height * 1.3), was = this.root.classList.contains('is-narrow');
    this.root.classList.toggle('is-narrow', narrow);
    this.applyDockH(r);
    if (was !== narrow) this.paintGuide();
    this.root.classList.toggle('is-wide', !narrow && ((r.width >= 900 && r.height >= 540) || r.width >= r.height * 1.3));
    var dk = this.$('.mrs-dock'); if (dk) this.root.style.setProperty('--dock-h', (narrow ? dk.offsetHeight : 0) + 'px');
    if (!this.S) return;
    var dpr = this.dpr();
    this.S.resize(r.width * dpr, r.height * dpr);
    if (refit || this.view.fit) this.fit(true);
    else this.applyView();
  };

  Studio.prototype.fit = function (quiet) {
    if (!this.W) return;
    var a = this.area(), s = Math.min(a.w / this.W, a.h / this.H);
    this.view = { s: s, x: a.x + (a.w - this.W * s) / 2, y: a.y + (a.h - this.H * s) / 2, fit: true, fitS: s };
    this.applyView();
  };

  Studio.prototype.zoomAt = function (s, cx, cy) {
    var v = this.view, a = this.area(), fitS = Math.min(a.w / this.W, a.h / this.H);
    s = clamp(s, fitS * .5, 16 / this.dpr() * 2);
    var dx = (cx - v.x) / v.s, dy = (cy - v.y) / v.s;
    this.view = { s: s, x: cx - dx * s, y: cy - dy * s, fit: false, fitS: fitS };
    this.clampView();
    this.applyView();
  };
  Studio.prototype.zoomBy = function (k) { var a = this.area(); this.zoomAt(this.view.s * k, a.x + a.w / 2, a.y + a.h / 2); };
  Studio.prototype.zoomTo = function (s) { var a = this.area(); this.zoomAt(s, a.x + a.w / 2, a.y + a.h / 2); };
  Studio.prototype.clampView = function () {
    var v = this.view, r = this.root.getBoundingClientRect(), m = 80;
    v.x = clamp(v.x, m - this.W * v.s, r.width - m);
    v.y = clamp(v.y, m - this.H * v.s, r.height - m);
  };
  Studio.prototype.applyView = function () {
    if (!this.S) return;
    var v = this.view, dpr = this.dpr();
    this.S.setView(v.s * dpr, v.x * dpr, v.y * dpr);
    var self = this; this.S.setMoving(true); clearTimeout(this._still);
    this._still = setTimeout(function () { if (self.S) { self.S.setMoving(false); self.kick(); } }, 160);
    this.paintZoom(); this.paintTip(); this.kick();
  };
  Studio.prototype.paintZoom = function () {
    var z = this.$('.mrs-zpct'); if (!z) return;
    z.textContent = Math.round((this.view.s || 1) * this.dpr() * 100) + '%';
  };

  Studio.prototype.kick = function () {
    if (this._raf || !this.S) return;
    var self = this, last = performance.now();
    var loop = function (now) {
      self._raf = 0;
      if (!self.S) return;
      var gap = now - last, dt = Math.min(.05, gap / 1000); last = now;
      var S = self.S, t0 = performance.now(), work = !self._replaying && ((S.q && S.q.length) || S.wet || S.dirty);
      if (work) S.timeBegin();
      if (S.q && S.q.length) S.pump(Infinity);
      var wet = S.wet && !self._replaying ? S.tick(dt) : false;
      if (self.live && self.live.dwell) self.dwell(dt);
      if (S.dirty && !self._replaying) S.render(true);
      if (work) S.timeEnd();
      if (self.live && !self.live.pend && self.quality === 'auto' && self.perf && !self._labRun) {
        var w = self._slow = self._slow || { n: 0, sum: 0, js: 0 };
        var dtm = w.t ? now - w.t : 16; if (dtm < 1000) { w.n++; w.sum += dtm; w.js += performance.now() - t0; } w.t = now;
        if (w.n >= 40) {
          var fa = w.sum / w.n, ga = S.gpuAvg(), outside = ga != null && ga * 2.5 < fa && w.js / w.n * 2.5 < fa;
          if (fa > 45 && !outside && stepDown(self.perf)) { self.dprCap = self.perf.cap; self.layout(); self.toast(T('خفّفنا الجودةَ ليجري الرسمُ بسلاسة على هذا الجهاز — غيّرْها من «الإعدادات» إن شئت.', 'We lowered the quality so drawing stays smooth on this device — change it in Settings if you like.')); }
          else if (fa > 28 && outside) self.capHint(fa, ga);
          self._slow = null;
        }
      } else if (self._slow) self._slow.t = 0;
      if (wet || self.S.wet || (self.live && self.live.dwell) || (self.S.q && self.S.q.length)) self._raf = requestAnimationFrame(loop);
    };
    this._raf = requestAnimationFrame(loop);
  };

  Studio.prototype.capHint = function (fa, ga) {
    this.capped = { fps: Math.round(1000 / fa), gpu: +ga.toFixed(1) };
    var k = 'garden_mirsam_caphint', seen = store(k);
    if (this._capSaid || (seen && seen.key === perfKey() && Date.now() - seen.at < 864e5 * 3)) return;
    this._capSaid = true; store(k, { key: perfKey(), at: Date.now() });
    this.toast(T('المتصفّحُ يعرض ' + this.capped.fps + ' إطاراً في الثانية فقط وبطاقةُ الرسوم شبهُ خاملة — غالباً «توفيرُ الطاقة» في المتصفّح أو ويندوز. صِلِ الشاحن أو أطفئه ليجري القلمُ أنعم.', 'The browser shows only ' + this.capped.fps + ' frames a second while the graphics card is almost idle — usually power saving in the browser or Windows. Plug in or turn it off for a smoother pen.'));
  };
  Studio.prototype.palm = function () { var I = window.GardenInkInput; return I && I.palmMode ? I.palmMode('auto') : 'auto'; };
  Studio.prototype.setPalm = function (m, say) {
    var I = window.GardenInkInput; if (I && I.setPalmMode) I.setPalmMode(m);
    this.paintChrome();
    if (say) this.toast(m === 'never' ? T('الإصبعُ يرسم الآن — والتكبيرُ بالأزرار أو بعجلة الفأرة.', 'Your finger draws now — zoom with the buttons or the mouse wheel.') : T('الإصبعُ يحرّك الرسمةَ ويكبّرها، والقلمُ وحدَه يرسم.', 'Your finger moves and zooms the drawing; only the pen draws.'));
  };

  Studio.prototype.toDoc = function (x, y) { var v = this.view; return { x: (x - v.x) / v.s, y: (y - v.y) / v.s }; };

  Studio.prototype.bindRouter = function () {
    var self = this, live = {}, g0 = null, tapG = null;
    if (!window.GardenInkInput) return;
    var ACT = { era: 'eraser', hand: 'pan', sel: 'pick', lasso: 'pick', hi: 'blend' };
    this.router = GardenInkInput.create({
      el: this.gl,
      palmDefault: '',
      mode: function () { return self.panKey || self.hand ? 'pan' : 'draw'; },
      onBegin: function (id, pt, ptype, act) {
        if (self.S) self.S.lastIn = performance.now();
        var p = self.toDoc(pt.x, pt.y);
        p.p = ptype === 'pen' ? pt.p : .6; p.tz = pt.tz || 0; p.az = pt.az;
        var tool = act ? (ACT[act] || null) : null;
        if (act && tool === 'pan') { live[id] = { pan: { x: pt.x, y: pt.y, vx: self.view.x, vy: self.view.y } }; return; }
        live[id] = self.begin(p, tool, ptype);
        self.cursorAt(pt.x, pt.y, ptype, p);
      },
      onMove: function (id, pts, tr) {
        if (self.S) self.S.lastIn = performance.now();
        var s = live[id]; if (!s) return;
        if (s.pan) { var q = pts[pts.length - 1]; self.view.x = s.pan.vx + q.x - s.pan.x; self.view.y = s.pan.vy + q.y - s.pan.y; self.view.fit = false; self.clampView(); self.applyView(); return; }
        for (var i = 0; i < pts.length; i++) {
          var pt = pts[i], p = self.toDoc(pt.x, pt.y);
          p.p = s.ptype === 'pen' ? pt.p : .6; p.tz = pt.tz || 0; p.az = pt.az;
          self.move(s, p);
        }
        var l = pts[pts.length - 1]; self.cursorAt(l.x, l.y, s.ptype, self.toDoc(l.x, l.y));
      },
      onEnd: function (id, keep) { var s = live[id]; delete live[id]; if (s && !s.pan) self.finish(s, keep); },
      onGesture: function (phase, g) {
        if (self.S) self.S.lastIn = performance.now();
        if (phase === 'start' && !tapG) tapG = { t: performance.now(), n: g.n, at: {}, moved: 0 };
        if (tapG && g.n) {
          tapG.n = Math.max(tapG.n, g.n);
          if (g.cx != null && g.n === tapG.n) { var a0 = tapG.at[g.n] || (tapG.at[g.n] = { x: g.cx, y: g.cy }); tapG.moved = Math.max(tapG.moved, Math.hypot(g.cx - a0.x, g.cy - a0.y)); }
        }
        if (phase === 'end' || !g.n) {
          if (tapG && performance.now() - tapG.t < 320 && tapG.moved < 12 && !tapG.zoomed) { if (tapG.n === 2) self.step(-1); else if (tapG.n >= 3) self.step(1); }
          tapG = null; g0 = null; return;
        }
        var r = self.root.getBoundingClientRect(), cx = g.cx - r.left, cy = g.cy - r.top;
        if (!g0 || g0.n !== g.n) g0 = { n: g.n, d: g.d || 0, cx: cx, cy: cy, s: self.view.s, vx: self.view.x, vy: self.view.y };
        if (g.n >= 2 && g0.d) {
          var s2 = g0.s * g.d / g0.d, dx = (g0.cx - g0.vx) / g0.s, dy = (g0.cy - g0.vy) / g0.s;
          var a = self.area(), fitS = Math.min(a.w / self.W, a.h / self.H);
          s2 = clamp(s2, fitS * .5, 16 / self.dpr() * 2);
          self.view = { s: s2, x: cx - dx * s2, y: cy - dy * s2, fit: false, fitS: fitS };
          if (Math.abs(g.d - g0.d) > 10 || Math.hypot(cx - g0.cx, cy - g0.cy) > 10) { if (tapG) tapG.zoomed = 1; }
          self.clampView(); self.applyView();
        } else if (g.n === 1) {
          self.view.x = g0.vx + cx - g0.cx; self.view.y = g0.vy + cy - g0.cy; self.view.fit = false; self.clampView(); self.applyView();
        }
      }
    });
  };

  Studio.prototype.bindInput = function () {
    var self = this, root = this.root, pan = null;
    root.addEventListener('wheel', function (e) {
      if (!self.S || !e.target.closest('.mrs-gl')) return;
      e.preventDefault();
      var r = root.getBoundingClientRect(), cx = e.clientX - r.left, cy = e.clientY - r.top;
      var pad = e.deltaMode === 0 && (Math.abs(e.deltaX) > 0 || Math.abs(e.deltaY) < 40 && e.deltaY % 1 !== 0);
      if (e.ctrlKey || e.metaKey || !pad) {
        var k = Math.exp(-clamp(e.deltaMode === 1 ? e.deltaY * 33 : e.deltaY, -120, 120) / (e.ctrlKey ? 110 : 420));
        self.zoomAt(self.view.s * k, cx, cy);
      } else {
        self.view.x -= e.deltaX; self.view.y -= e.deltaY; self.view.fit = false; self.clampView(); self.applyView();
      }
    }, { passive: false });
    root.addEventListener('pointerdown', function (e) {
      if (!e.target.closest('.mrs-gl')) return;
      if (e.pointerType === 'mouse' && (e.button === 1 || e.button === 2)) {
        e.preventDefault(); pan = { id: e.pointerId, x: e.clientX, y: e.clientY, vx: self.view.x, vy: self.view.y };
        try { e.target.setPointerCapture(e.pointerId); } catch (x) {}
      }
    }, true);
    root.addEventListener('pointermove', function (e) {
      if (pan && e.pointerId === pan.id) { self.view.x = pan.vx + e.clientX - pan.x; self.view.y = pan.vy + e.clientY - pan.y; self.view.fit = false; self.clampView(); self.applyView(); return; }
      if (!e.target.closest || !e.target.closest('.mrs-gl')) { self.cursorOff(); return; }
      if (e.pointerType === 'touch') { self.cursorOff(); return; }
      var r = root.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top, p = self.toDoc(x, y);
      if (e.pointerType === 'pen' && window.GardenInkInput) { var t = GardenInkInput.readTilt(e); if (t) { p.tz = t.tz; p.az = t.az; } }
      self.cursorAt(x, y, e.pointerType, p);
    });
    var endPan = function (e) { if (pan && e.pointerId === pan.id) pan = null; };
    root.addEventListener('pointerup', endPan); root.addEventListener('pointercancel', endPan);
    root.addEventListener('pointerleave', function () { self.cursorOff(); });
    root.addEventListener('contextmenu', function (e) { if (e.target.closest('.mrs-gl')) e.preventDefault(); });
  };

  Studio.prototype.bindKeys = function () {
    var self = this;
    var held = null;
    this._key = function (e) {
      if (!self.root.isConnected || !self.root.offsetParent && !self.root.getClientRects().length) return;
      var t = e.target;
      if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName)) && t.type !== 'range') return;
      var k = window.GardenInkInput ? GardenInkInput.keyOf(e) : String(e.key || '').toLowerCase();
      var mod = e.ctrlKey || e.metaKey;
      if (mod && k === 'z') { e.preventDefault(); self.step(e.shiftKey ? 1 : -1); return; }
      if (mod && e.shiftKey && k === 'd') { e.preventDefault(); var on = !self.$('.mrs-diag'); store('garden_mrsdiag', on ? 1 : 0); if (on) self.diag(); else { self.$('.mrs-diag').remove(); var b = self.$('.mrs-lab-btn'); if (b) b.remove(); clearInterval(self._diagT); } return; }
      if (mod && k === 'y') { e.preventDefault(); self.step(1); return; }
      if (mod && (k === '0')) { e.preventDefault(); self.fit(); return; }
      if (mod || e.altKey) return;
      if (e.code === 'Space') { if (!self.panKey) { self.panKey = true; self.root.classList.add('is-pan'); } e.preventDefault(); return; }
      if (k === 'escape' && self.$('.mrs-book') && !self.$('.mrs-book').hidden) { e.preventDefault(); e.stopPropagation(); self.book(false); return; }
      if (k === 'escape' && self.orig) { e.preventDefault(); e.stopPropagation(); self.setOrig(false); return; }
      var pk = window.GardenInkInput ? GardenInkInput.penKeys() : {};
      var MAP = { era: 'eraser', sel: 'pick', lasso: 'pick', hi: 'blend', hand: null };
      if (pk[k] && MAP[pk[k]] !== undefined) {
        e.preventDefault();
        if (MAP[pk[k]]) { if (self.tool === MAP[pk[k]] && self._prevTool) self.setTool(self._prevTool); else { self._prevTool = self.tool; self.setTool(MAP[pk[k]]); } }
        return;
      }
      if (k === '[' || k === ']') {
        e.preventDefault();
        var key = self.sizeKey(), v = self.sizes[key] == null ? (BYID[key].def || .35) : self.sizes[key];
        self.sizes[key] = clamp(v + (k === ']' ? .04 : -.04), 0, 1); self.$('.mrs-size').value = self.sizes[key]; self.paintTip(); self.savePrefs(); return;
      }
      if (k === '=' || k === '+') { e.preventDefault(); self.zoomBy(1.4); return; }
      if (k === '-') { e.preventDefault(); self.zoomBy(1 / 1.4); return; }
      if (k === '0') { e.preventDefault(); self.fit(); return; }
      if (k === '1') { e.preventDefault(); self.zoomTo(1 / self.dpr()); return; }
      if (k === 'h') { e.preventDefault(); self.setHand(!self.hand); return; }
      if (k === 'v') { e.preventDefault(); self.setOrig(!self.orig); return; }
      if (k === 'l') { e.preventDefault(); self.lock = !self.lock; self.paintChrome(); return; }
      if (k === 'x') { e.preventDefault(); var c0 = self.color; if (self.prevColor) { self.setColor(self.prevColor, true); self.prevColor = c0; } return; }
      for (var i = 0; i < TOOLS.length; i++) if (TOOLS[i].key === k) { e.preventDefault(); self.setTool(TOOLS[i].id); return; }
    };
    this._keyup = function (e) { if (e.code === 'Space' && self.panKey) { self.panKey = false; self.root.classList.toggle('is-pan', !!self.hand); } };
    document.addEventListener('keydown', this._key, true);
    document.addEventListener('keyup', this._keyup, true);
  };

  Studio.prototype.cursorAt = function (x, y, ptype, p) {
    var c = this.$('.mrs-cursor');
    if (ptype === 'touch' || !this.S) { c.hidden = true; return; }
    var t = this.tool, s = this.view.s;
    if (t === 'pick' || t === 'fill') {
      c.hidden = false; c.dataset.kind = t;
      c.style.transform = 'translate(' + x + 'px,' + y + 'px)';
      var g = c.querySelector('.mrs-cur-g');
      g.setAttribute('transform', '');
      c.querySelectorAll('.mrs-cur-o,.mrs-cur-i').forEach(function (n) { n.setAttribute('r', 9); n.removeAttribute('rx'); });
      return;
    }
    var r = Math.max(1.5, this.radius(t) * s);
    var tz = p && p.tz || 0, az = p && p.az != null ? p.az : 0;
    var elong = (t === 'pencil' || t === 'graphite') ? 1 + 2.4 * tz : (t === 'pastel' || t === 'crayon') ? 1 + 1.5 * tz : 1;
    c.hidden = false; c.dataset.kind = t === 'marker' ? 'chisel' : 'round';
    c.style.transform = 'translate(' + x + 'px,' + y + 'px)';
    var g2 = c.querySelector('.mrs-cur-g');
    if (t === 'marker') g2.setAttribute('transform', 'rotate(' + (34) + ') scale(1,' + .28 + ')');
    else g2.setAttribute('transform', 'rotate(' + (az * 180 / Math.PI) + ') scale(' + elong + ',1)');
    c.querySelectorAll('.mrs-cur-o,.mrs-cur-i').forEach(function (n) { n.setAttribute('r', r); });
  };
  Studio.prototype.cursorOff = function () { var c = this.$('.mrs-cursor'); if (c) c.hidden = true; };

  Studio.prototype.region = function (x, y) {
    if (!this.lock || !this.regions) return null;
    var L = this.regions.at(x, y);
    return L ? this.regions.mask(L) : null;
  };

  Studio.prototype.begin = function (p, override, ptype) {
    if (!this.S || this._auto || this._replaying) return null;
    var tool = override || this.tool;
    if (tool === 'pick') { this.pickAt(p.x, p.y); return { done: 1 }; }
    if (tool === 'fill') return { tap: p, ptype: ptype };
    var t = BYID[tool]; if (!t || !t.eng) return null;
    this.prevColor = this.prevColor || this.color;
    var mask = tool === 'eraser' || tool === 'blend' ? (this.lock ? this.region(p.x, p.y) : null) : this.region(p.x, p.y);
    var k = .4 + .9 * this.strength;
    if (!mask && this.lock && this.regions) { this.live = { pend: 1, tool: tool, ptype: ptype, k: k }; return this.live; }
    return this.open(tool, mask, p, ptype, k);
  };
  Studio.prototype.open = function (tool, mask, p, ptype, k) {
    var t = BYID[tool];
    var st = this.S.stroke(t.eng, this.color, this.radius(tool), {
      maskObj: mask || null, mask: !!mask, grade: this.grade, load: tool === 'wash' ? .5 + .5 * this.strength : 1, flow: tool === 'marker' || tool === 'airbrush' ? .35 + .75 * this.strength : 1, nib: .6
    });
    var s = { st: st, tool: tool, ptype: ptype, k: k, dwell: tool === 'airbrush' || tool === 'wash', still: 0 };
    s.tip = this.pp(p, k);
    this.S.startStroke(st, s.tip);
    this.live = s;
    this.kick();
    return s;
  };
  Studio.prototype.pp = function (p, k) { return { x: p.x, y: p.y, p: clamp((p.p == null ? .6 : p.p) * k, .03, 1), tz: p.tz || 0, az: p.az }; };

  Studio.prototype.move = function (s, p) {
    if (!s || s.done || s.tap) return;
    if (s.pend) {
      var m0 = this.region(p.x, p.y); if (!m0) return;
      var o = this.open(s.tool, m0, p, s.ptype, s.k);
      for (var key in o) s[key] = o[key];
      delete s.pend; this.live = s; return;
    }
    p = this.pp(p, s.k); s.tip = p;
    if (this.S.feed(s.st, p) === false) return;
    s.still = 0;
    this.kick();
  };

  Studio.prototype.dwell = function (dt) {
    var s = this.live; if (!s || !s.dwell || s.done) return;
    s.still += dt;
    if (s.still < .12) return;
    this.S.dwell(s.st, dt);
  };

  Studio.prototype.finish = function (s, keep) {
    if (!s || s.done) { this.live = null; return; }
    if (s.tap) { if (keep) this.fillAt(s.tap.x, s.tap.y); this.live = null; return; }
    if (s.pend) { this.live = null; return; }
    this.S.feedEnd(s.st);
    if (!keep && s.ptype === 'touch') this.S.abort(s.st);
    else { this.S.endStroke(s.st); this.changed++; this.addRecent(this.color); }
    this.live = null;
    this.paintChrome(); this.kick();
  };

  Studio.prototype.fillAt = function (x, y) {
    var self = this;
    if (!this.regions && this.regionsP) { this.regionsP.then(function () { if (self.regions) self.fillAt(x, y); }); return; }
    var L = this.regions && this.regions.at(x, y);
    if (!L) { this.toast(T('اضغطْ داخل شكلٍ مغلقٍ لتملأه.', 'Tap inside a closed shape to fill it.')); return; }
    var m = this.regions.mask(L), med = BYID[this.medium] && BYID[this.medium].eng || 'pencil';
    if (med === 'eraser' || med === 'blend') med = 'pencil';
    this.S.fillRegion(m, med, this.color, { shade: this.shade, grade: this.grade, amt: .55 + .5 * this.strength });
    this.changed++; this.addRecent(this.color);
    this.paintChrome(); this.kick();
  };

  Studio.prototype.pickAt = function (x, y) {
    if (!this.S) return;
    var c;
    if (this.orig && this.refImg) {
      var cv = this._refC;
      if (!cv) { cv = this._refC = canvas(this.W, this.H); ctx2(cv, true).drawImage(this.refImg, 0, 0, this.W, this.H); }
      var d = ctx2(cv, true).getImageData(clamp(x | 0, 0, this.W - 1), clamp(y | 0, 0, this.H - 1), 1, 1).data; c = [d[0], d[1], d[2]];
    } else c = this.S.sample(clamp(x, 0, this.W - 1), clamp(y, 0, this.H - 1));
    var hex = rgbHex(c[0], c[1], c[2]);
    this.prevColor = this.color;
    this.setColor(hex, true); this.addRecent(hex);
    this.toast(T('أُخذ اللون: ', 'Picked: ') + this.colorName(hex));
  };

  Studio.prototype.step = function (dir) {
    if (!this.S || this._replaying) return;
    if (this.S.step(dir)) { this.changed++; this.kick(); }
    this.paintChrome();
  };

  Studio.prototype.wipe = function () {
    if (!this.S || this._auto || this._replaying) return;
    this.S.clear(false); this.changed++; this.kick(); this.paintChrome();
    this.toast(T('مُسح التلوين — «تراجع» يعيده.', 'Coloring cleared — Undo brings it back.'));
  };

  Studio.prototype.isDirty = function () { return this.changed > 0; };

  Studio.prototype.toBlob = function (type, q) {
    var self = this;
    if (this.S && this.S.wet) this.S.dryNow();
    var c = this.S.exportCanvas({ lines: !this.steps, paper: true });
    return new Promise(function (res) { c.toBlob(res, type || 'image/webp', q || .92); });
  };
  Studio.prototype.paintBlob = function () {
    var c = this.S.exportCanvas({ layer: true });
    return new Promise(function (res) { c.toBlob(res, 'image/webp', .95); });
  };
  Studio.prototype.project = function () {
    var it = this.item || {}, real = function (u) { return u && !/^blob:/.test(u) ? u : ''; };
    return { v: 1, W: this.W, H: this.H, pp: this.paperKind, it: it.id || '', ln: it.srcLine || real(it.lineUrl), cr: it.srcRef || real(it.refUrl) };
  };

  var MRS_MIME = 'application/x-garden-mirsam', MRS_MAGIC = [77, 73, 82, 83, 65, 77, 48, 49];
  function zipBuf(buf) {
    if (!window.CompressionStream) return Promise.resolve(null);
    return new Response(new Blob([buf]).stream().pipeThrough(new CompressionStream('deflate-raw'))).arrayBuffer().catch(function () { return null; });
  }
  function unzipBuf(buf) { return new Response(new Blob([buf]).stream().pipeThrough(new DecompressionStream('deflate-raw'))).arrayBuffer(); }
  function bufOf(x) { return x instanceof Blob ? x.arrayBuffer() : Promise.resolve(x); }
  function packProject(head, parts) {
    return Promise.all(parts.map(function (p) {
      return bufOf(p.buf).then(function (b) {
        if (!p.z) return { n: p.n, data: b, z: 0, t: p.t || '' };
        return zipBuf(b).then(function (z) { return z ? { n: p.n, data: z, z: 1 } : { n: p.n, data: b, z: 0 }; });
      });
    })).then(function (list) {
      head.parts = list.map(function (x) { return { n: x.n, len: x.data.byteLength, z: x.z, t: x.t || '' }; });
      var hj = new TextEncoder().encode(JSON.stringify(head)), pre = new Uint8Array(12);
      pre.set(MRS_MAGIC); new DataView(pre.buffer).setUint32(8, hj.length, true);
      return new Blob([pre, hj].concat(list.map(function (x) { return x.data; })), { type: MRS_MIME });
    });
  }
  function readProject(blob) {
    return bufOf(blob).then(function (ab) {
      var u = new Uint8Array(ab);
      if (u.length < 12 || MRS_MAGIC.some(function (c, i) { return u[i] !== c; })) throw new Error('not-mirsam');
      var hl = new DataView(ab).getUint32(8, true), head = JSON.parse(new TextDecoder().decode(u.subarray(12, 12 + hl)));
      if (head.app !== 'garden-mirsam' || !head.W || !head.H) throw new Error('not-mirsam');
      var o = 12 + hl, parts = {};
      return Promise.all((head.parts || []).map(function (p) {
        var b = ab.slice(o, o + p.len); o += p.len;
        return (p.z ? unzipBuf(b) : Promise.resolve(b)).then(function (d) { parts[p.n] = p.t ? new Blob([d], { type: p.t }) : d; });
      })).then(function () { return { head: head, parts: parts }; });
    });
  }
  function libBase() { return window.GardenLibrary && GardenLibrary.base || new URL('../library/', location.href).href; }
  function libPath(u) {
    u = String(u || ''); if (!u || /^blob:/.test(u)) return '';
    if (/^lib:/.test(u)) return u;
    var b = libBase(); if (u.indexOf(b) === 0) return 'lib:' + u.slice(b.length);
    var k = u.indexOf('/library/'); return k >= 0 ? 'lib:' + u.slice(k + 9) : u;
  }
  function isLib(u) { return /^lib:/.test(u || ''); }
  function libUrl(u) { u = String(u || ''); return isLib(u) ? libBase() + u.slice(4) : (/\/library\//.test(u) ? libBase() + u.slice(u.indexOf('/library/') + 9) : u); }
  function slimProject(blob) {
    return readProject(blob).then(function (pj) {
      var h = pj.head, P = pj.parts;
      if (!h.recipe || !P.rec || (!P.state && !P.line && !P.ref)) return blob;
      var parts = [];
      if (P.thumb) parts.push({ n: 'thumb', buf: P.thumb, t: 'image/webp' });
      parts.push({ n: 'rec', buf: P.rec, z: 1 });
      if (P.line && !isLib(h.item && h.item.line)) parts.push({ n: 'line', buf: P.line, t: 'image/png' });
      if (P.ref && !isLib(h.item && h.item.color)) parts.push({ n: 'ref', buf: P.ref, t: P.ref.type || 'image/webp' });
      var head = Object.assign({}, h); delete head.parts;
      return packProject(head, parts).then(function (b) { return b.size < blob.size ? b : blob; });
    }, function () { return blob; });
  }
  function canvasBlob(c, type, q) { return new Promise(function (k) { c.toBlob(k, type, q); }); }
  function imgBlob(img, type, q) {
    var c = canvas(img.naturalWidth || img.width, img.naturalHeight || img.height); ctx2(c).drawImage(img, 0, 0);
    return canvasBlob(c, type, q);
  }
  function fileName(t, ext) { return (String(t || '').replace(/[\\/:*?"<>|]+/g, ' ').trim().slice(0, 60) || T('رسمتي', 'my-drawing')) + '.' + ext; }
  function download(blob, name) {
    var a = document.createElement('a'), u = URL.createObjectURL(blob);
    a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(u); }, 4000);
  }

  Studio.prototype.exportProject = function (opt) {
    opt = opt || {};
    var self = this, S = this.S;
    if (!S || this.steps || !this.lineCanvas || this._replaying) return Promise.reject(new Error('no-project'));
    if (S.wet) S.dryNow();
    var log = S.log, recipe = !!log && !log.some(function (o) { return o[0] === 'L' && o[1] !== 'ref'; }), slim = !!opt.slim && recipe;
    var d = slim ? null : S.dump(), it = this.item || {}, lnk = { line: libPath(it.srcLine || it.lineUrl), color: libPath(it.srcRef || it.refUrl) };
    var rec = recipe ? GardenPaintGL.encodeLog(log) : null;
    var thumb = S.exportCanvas({ scale: Math.min(1, 320 / Math.max(this.W, this.H)), lines: true, paper: true });
    var refP = !this.refImg ? Promise.resolve(null) : (it.refUrl && !/^blob:/.test(it.refUrl) ? fetch(it.refUrl).then(function (r) { if (!r.ok) throw 0; return r.blob(); }) : Promise.reject(0))
      .catch(function () { return imgBlob(self.refImg, 'image/webp', .95); });
    return Promise.all([canvasBlob(this.lineCanvas, 'image/png'), refP, canvasBlob(thumb, 'image/webp', .8)]).then(function (r) {
      var head = { app: 'garden-mirsam', v: rec ? 2 : 1, W: self.W, H: self.H, fmt: d ? d.fmt : (S.hdr ? 'h' : 'b'), paper: S.paperKind, paper0: S.paper0 || S.paperKind,
        steps: S.undo.length, title: self.title || '', item: { id: it.id || '', line: lnk.line, color: lnk.color },
        recipe: recipe, engine: GardenPaintGL.ENGINE, ops: log ? log.length : 0, tool: self.tool, color: self.color, saved: Date.now() };
      var parts = [{ n: 'thumb', buf: r[2], t: 'image/webp' }];
      if (rec) parts.push({ n: 'rec', buf: rec, z: 1 });
      if (d) parts.push({ n: 'state', buf: d.state, z: 1 }, { n: 'hist', buf: d.hist, z: 1 });
      if (!slim || !isLib(lnk.line)) parts.push({ n: 'line', buf: r[0], t: 'image/png' });
      if (r[1] && (!slim || !isLib(lnk.color))) parts.push({ n: 'ref', buf: r[1], t: r[1].type || 'image/webp' });
      return packProject(head, parts);
    });
  };
  Studio.prototype.fileItems = function () {
    var lesson = !!this.steps;
    return [
      this.opts.onSaveMine && !lesson ? { a: 'mine', i: 'fa-folder-open', t: T('احفظْها في «رسوماتي»', 'Save to “My drawings”') } : null,
      { a: 'png', i: 'fa-image', t: T('نزّلْها صورة (PNG)', 'Download as image (PNG)') },
      { a: 'copy', i: 'fa-copy', t: T('انسخْها صورةً', 'Copy as image') },
      { sep: 1 },
      { a: 'file', i: 'fa-floppy-disk', t: T('صدّرْ ملفَّ المرسم — يُكمَل لاحقاً بكلِّ تفاصيله', 'Export studio file — reopen with every detail'), off: lesson },
      { a: 'open', i: 'fa-file-import', t: T('افتحْ ملفَّ مرسم…', 'Open a studio file…') }
    ].filter(Boolean);
  };
  Studio.prototype.fileMenu = function (btn) {
    var self = this, M = window.GardenMenu;
    if (!M) return;
    var r = btn.getBoundingClientRect();
    var html = M.head(T('حفظٌ وتصدير', 'Save & export')) + this.fileItems().map(function (x) { return x.sep ? M.sep() : M.item(x.a, x.i, x.t, { off: x.off }); }).join('');
    M.open(r.left, r.bottom + 6, html, function (act) { self.fileAct(act); }, { within: this.root.closest('dialog') || null, label: T('ملفّ', 'File') });
  };
  Studio.prototype.moreMenu = function (btn) {
    var self = this, M = window.GardenMenu;
    if (!M || !M.rich) return;
    var narrow = this.root.classList.contains('is-narrow'), r = btn.getBoundingClientRect(), G = window.Garden || {};
    var th = document.documentElement.getAttribute('data-theme') || 'dark', en = lang() === 'en', quick = [], items = [];
    if (narrow) {
      if (this.hasRef && !this.steps) quick.push({ a: 'auto', i: 'fa-wand-magic-sparkles', t: this._auto ? T('أوقِفْ', 'Stop') : T('لوّنْها', 'Auto-color') });
      if (this.hasRef) quick.push({ a: 'orig', i: this.orig ? 'fa-eye-slash' : 'fa-eye', t: T('الأصل', 'Original') });
      quick.push({ a: 'fit', i: 'fa-expand', t: T('ملءُ الشاشة', 'Fit') });
      quick.push({ a: 'wipe', i: 'fa-broom', t: T('امسحْ', 'Clear'), dz: true });
      items.push({ h: T('الرسمة', 'Drawing') },
        { t: T('ملفّ: احفظْ أو صدّرْ أو افتحْ', 'File: save, export or open'), i: 'fa-floppy-disk', sub: this.fileItems() },
        { a: 'hand', i: 'fa-hand', t: T('اليد: اسحبِ الرسمةَ لتتنقّل فيها', 'Hand: drag to move around'), ok: !!this.hand },
        { a: 'finger', i: 'fa-hand-pointer', t: T('الإصبعُ يرسم', 'Finger draws'), ok: this.palm() === 'never' });
    }
    items.push({ a: 'opts', i: 'fa-sliders', t: T('الورقُ والجودةُ واللمس', 'Paper, quality and touch'), ok: !this.$('.mrs-opts').hidden },
      { a: 'help', i: 'fa-circle-question', t: T('شرحُ الأداة', 'Tool guide'), ok: this.helpOn() },
      { h: T('المظهر', 'Appearance') },
      { t: T('الثيم', 'Theme'), i: 'fa-circle-half-stroke', sub: [['dark', 'fa-moon', 'داكن', 'Dark'], ['dim', 'fa-cloud-moon', 'خافت', 'Dim'], ['light', 'fa-sun', 'فاتح', 'Light']]
        .map(function (x) { return { a: 'th:' + x[0], i: x[1], t: en ? x[3] : x[2], ok: th === x[0] }; }) },
      { a: 'lang', i: 'fa-language', t: en ? 'العربيّة' : 'English', off: !G.setLanguage });
    M.rich(r.left, r.bottom + 6, { quick: quick, items: items }, function (act) { self.moreAct(act); },
      { within: this.root.closest('dialog') || null, label: T('المزيد', 'More'), anchorEnd: true });
  };
  Studio.prototype.moreAct = function (act) {
    var G = window.Garden || {};
    if (/^th:/.test(act)) { if (G.applyTheme) G.applyTheme(act.slice(3)); this.deskSync(); return; }
    if (act === 'lang') { if (G.setLanguage) G.setLanguage(lang() === 'en' ? 'ar' : 'en'); return; }
    if (act === 'auto') { this.autoPaint(); return; }
    if (act === 'orig') { this.setOrig(!this.orig); return; }
    if (act === 'fit') { this.fit(); return; }
    if (act === 'wipe') { this.wipe(); return; }
    if (act === 'hand') { this.setHand(!this.hand); return; }
    if (act === 'finger') { this.setPalm(this.palm() === 'never' ? 'auto' : 'never', true); return; }
    if (act === 'help') { this.toggleHelp(); return; }
    if (act === 'opts') { var o = this.$('.mrs-opts'); o.hidden = !o.hidden; if (!o.hidden) this.root.classList.remove('is-folded'); this.paintChrome(); this.layout(); return; }
    this.fileAct(act);
  };
  Studio.prototype.deskSync = function () {
    if (!this.S) return;
    var bg = getComputedStyle(this.root).getPropertyValue('--mrs-desk').trim(), d = hexRgb(/^#[0-9a-f]{6}$/i.test(bg) ? bg : '#1c2029');
    this.S.setDesk([d[0] / 255, d[1] / 255, d[2] / 255]);
    this.applyView();
  };
  Studio.prototype.helpOn = function () { return this.root.classList.contains('is-narrow') ? !!this.helpN : !!this.help; };
  Studio.prototype.toggleHelp = function () {
    if (this.root.classList.contains('is-narrow')) this.helpN = !this.helpN; else this.help = !this.help;
    this.savePrefs(); this.paintGuide(); this.layout();
  };
  Studio.prototype.applyDockH = function (r) {
    var dk = this.$('.mrs-dock'), narrow = this.root.classList.contains('is-narrow');
    if (!dk) return;
    if (!narrow || !this.dockH || this.root.classList.contains('is-folded')) { dk.style.blockSize = ''; this.root.classList.remove('is-sized'); return; }
    var max = Math.round((r || this.root.getBoundingClientRect()).height * .72);
    dk.style.blockSize = Math.max(this.dockMin(), Math.min(max, this.dockH)) + 'px';
    this.root.classList.add('is-sized');
  };
  Studio.prototype.dockMin = function () {
    var dk = this.$('.mrs-dock'), h = 0;
    ['.mrs-grip', '.mrs-now', '.mrs-dhead', '.mrs-tabs'].forEach(function (s) { var e = dk.querySelector(s); if (e && !e.hidden) h += e.offsetHeight; });
    return h + 60;
  };
  Studio.prototype.bindGrip = function () {
    var self = this, g = this.$('.mrs-grip'), dk = this.$('.mrs-dock'), drag = null, raf = 0;
    var set = function (h, live) {
      self.dockH = Math.round(h);
      if (!live) self.savePrefs();
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = 0; self.layout(); });
    };
    g.addEventListener('pointerdown', function (e) {
      if (e.button) return;
      e.preventDefault();
      drag = { id: e.pointerId, y: e.clientY, h: dk.offsetHeight, moved: false, folded: self.root.classList.contains('is-folded') };
      try { g.setPointerCapture(e.pointerId); } catch (x) {}
      self.root.classList.add('is-resizing'); g.classList.add('is-drag');
    });
    g.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dy = drag.y - e.clientY;
      if (!drag.moved && Math.abs(dy) > 3) {
        drag.moved = true;
        if (drag.folded && dy > 0) { self.root.classList.remove('is-folded'); self.paintChrome(); drag.h = self.dockMin(); }
      }
      if (drag.moved && !self.root.classList.contains('is-folded')) set(drag.h + dy, true);
    });
    var end = function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag; drag = null;
      self.root.classList.remove('is-resizing'); g.classList.remove('is-drag');
      if (!d.moved || self.root.classList.contains('is-folded')) { if (!d.moved) self.root.classList.toggle('is-folded'); self.paintChrome(); self.layout(); return; }
      if (self.dockH < self.dockMin() - 24) { self.dockH = null; self.root.classList.add('is-folded'); self.paintChrome(); }
      set(self.dockH || 0);
    };
    g.addEventListener('pointerup', end); g.addEventListener('pointercancel', end);
    g.addEventListener('dblclick', function () { self.dockH = null; self.root.classList.remove('is-folded'); self.savePrefs(); self.paintChrome(); self.layout(); });
    g.addEventListener('keydown', function (e) {
      var k = e.key, step = e.shiftKey ? 80 : 24;
      if (k !== 'ArrowUp' && k !== 'ArrowDown') return;
      e.preventDefault();
      self.root.classList.remove('is-folded');
      set(dk.offsetHeight + (k === 'ArrowUp' ? step : -step));
    });
  };
  Studio.prototype.bindRackDrag = function () {
    var rack = this.$('.mrs-rack'), drag = null, eat = false;
    var edge = function () {
      var max = rack.scrollWidth - rack.clientWidth, x = Math.abs(rack.scrollLeft);
      rack.classList.toggle('is-more-s', max > 2 && x > 2);
      rack.classList.toggle('is-more-e', max > 2 && x < max - 2);
    };
    rack.addEventListener('scroll', edge, { passive: true });
    new ResizeObserver(edge).observe(rack);
    rack.addEventListener('pointerdown', function (e) {
      if (e.pointerType !== 'mouse' || e.button || !this.closest('.is-narrow')) return;
      drag = { id: e.pointerId, x: e.clientX, l: rack.scrollLeft, moved: false };
    });
    rack.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var dx = e.clientX - drag.x;
      if (!drag.moved && Math.abs(dx) < 6) return;
      if (!drag.moved) { drag.moved = true; try { rack.setPointerCapture(e.pointerId); } catch (x) {} }
      rack.scrollLeft = drag.l - dx;
    });
    var stop = function () { if (drag && drag.moved) { eat = true; setTimeout(function () { eat = false; }, 0); } drag = null; };
    rack.addEventListener('pointerup', stop); rack.addEventListener('pointercancel', stop);
    rack.addEventListener('click', function (e) { if (eat) { e.stopPropagation(); e.preventDefault(); eat = false; } }, true);
    rack.addEventListener('wheel', function (e) {
      if (!this.closest('.is-narrow') || Math.abs(e.deltaY) <= Math.abs(e.deltaX)) return;
      rack.scrollLeft += (getComputedStyle(rack).direction === 'rtl' ? -1 : 1) * e.deltaY; e.preventDefault();
    }, { passive: false });
  };
  Studio.prototype.fileAct = function (act) {
    var self = this;
    if (act === 'png') { this.toBlob('image/png').then(function (b) { download(b, fileName(self.title, 'png')); }); return; }
    if (act === 'copy') {
      var p = this.toBlob('image/png');
      var w;
      try { w = navigator.clipboard.write([new ClipboardItem({ 'image/png': p })]); } catch (e) { w = Promise.reject(e); }
      w.then(function () { self.toast(T('نُسخت الصورة — الصقْها حيث شئت.', 'Image copied — paste it anywhere.')); },
        function () { self.toast(T('لم يسمحِ المتصفّحُ بالنسخ — نزّلْها صورةً بدلاً منه.', 'The browser blocked copying — download it instead.')); });
      return;
    }
    if (act === 'file') {
      this.toast(T('أجهّز الملفّ…', 'Preparing the file…'));
      this.exportProject({ slim: true }).then(function (b) { download(b, fileName(self.title, 'mirsam')); self.toast(T('صُدّر ملفُّ المرسم: افتحْه لاحقاً من «ملفّ ← افتحْ» لتكملَ بكلِّ تفاصيله وتراجعه.', 'Exported — open it later from “File → Open” to continue with every detail and undo step.')); },
        function () { self.toast(T('تعذّر تصديرُ الملفّ.', 'Could not export the file.')); });
      return;
    }
    if (act === 'open') {
      var inp = document.createElement('input'); inp.type = 'file'; inp.accept = '.mirsam,' + MRS_MIME;
      inp.addEventListener('change', function () {
        var f = inp.files && inp.files[0]; if (!f) return;
        readProject(f).then(function (pj) {
          if (self.opts.onOpenFile) self.opts.onOpenFile(pj, self); else self.load({ project: pj, title: pj.head.title });
        }, function () { self.toast(T('هذا ليس ملفَّ مرسم.', 'This is not a studio file.')); });
      });
      inp.click();
      return;
    }
    if (act === 'mine' && this.opts.onSaveMine) this.opts.onSaveMine(this);
  };

  Studio.prototype.destroy = function () {
    document.removeEventListener('garden:languageChanged', this._onLang);
    document.removeEventListener('keydown', this._key, true);
    document.removeEventListener('keyup', this._keyup, true);
    if (this.ro) this.ro.disconnect();
    if (this.router) this.router.destroy();
    if (this._raf) cancelAnimationFrame(this._raf);
    if (this.S) { this.S.destroy(); this.S = null; }
    (this._pjUrls || []).forEach(function (u) { URL.revokeObjectURL(u); }); this._pjUrls = [];
    this.regions = null; this.refImg = null; this._refC = null;
    this.root.remove();
  };

  window.GardenColoring = {
    precompute: function (it) { try { precompute({ lineUrl: it.line, refUrl: it.color, W: it.W, H: it.H }); } catch (e) {} },
    warm: function () {
      if (!window.GardenPaintGL || !GardenPaintGL.warmup) return;
      var pr = store(PREF_KEY) || {}, t = BYID[pr.tool] && BYID[pr.tool].eng ? pr.tool : 'pencil', id = GardenPaintGL.TOOLS[t];
      GardenPaintGL.warmup(t === 'wash' ? ['comp', 'init', 'paper', 'back', 'wcAdd', 'wcStep', 'wcDep', 'fill:11:2'] : ['comp', 'init', 'paper', 'back', 'dab:' + id, 'fill:' + id + ':2']);
    },
    TOOLS: TOOLS,
    SETS: SETS,
    readProject: readProject,
    slim: slimProject,
    MIME: MRS_MIME,
    create: function (host, opts) { return new Studio(host, opts); },
    lineOnly: function (svg) { return withStyle(svg, HIDE_COLOR); },
    colored: function (svg) { return withStyle(svg, HIDE_GUIDE); },
    families: extractFamilies,
    ramp: rampOf
  };
})();
