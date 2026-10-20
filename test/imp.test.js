// Verifies every 7.8 problem: antiderivative, limits from the right side, the stated value or divergence,
// the step checks, the grader, and the multiple choice.
const katex = require('katex');
for (const n of ['engine', 'gen_common', 'gen_ibp', 'gen_trig', 'gen_tsub', 'gen_pf', 'gen_imp']) require(__dirname + '/../src/' + n + '.js');
const M = globalThis.M;
const N = +(process.argv[2] || 400);
let fails = 0, count = 0; const errs = {}; const fams = {};
function fail(key, msg) { fails++; errs[key] = (errs[key] || 0) + 1; if (errs[key] <= 3) console.log('FAIL', key, msg); }
function texOK(tex, where) { try { katex.renderToString(tex, { throwOnError: true, displayMode: true, trust: (c) => c.command === '\\htmlClass', strict: false }); } catch (e) { fail('katex:' + where, tex + '  ::  ' + e.message.slice(0, 120)); } }
function richOK(text, where) { if (!text) return; const parts = String(text).split('$'); if (parts.length % 2 === 0) fail('dollar:' + where, text); parts.forEach((p, i) => { if (i % 2 === 1) texOK(p, where); }); }
const num = (t) => (t === '\\infty' ? Infinity : t === '-\\infty' ? -Infinity : t === 'e' ? Math.E : parseFloat(t));
/** exact TeX → something a student could type */
function ascii(t) {
  let s = t;
  for (let k = 0; k < 4; k++) s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/e\^\{([^{}]*)\}/g, 'e^($1)');
  return s.replace(/\\pi/g, 'pi').replace(/\\ln/g, 'ln').replace(/\\left|\\right/g, '').replace(/\\,/g, '').replace(/\{|\}/g, '');
}
/** one piece: approach the trouble end, return {conv, value} */
function piece(F, from, to, bad) {
  // bad = 'to' or 'from' (which end is the trouble), approach points
  const seq = (end, side) => (Math.abs(end) === Infinity ? [1e6, 1e12, 1e24].map((v) => Math.sign(end) * v) : [1e-4, 1e-8, 1e-12].map((h) => end + side * h));
  const G = bad === 'to' ? seq(to, -1).map((t) => F(t) - F(from)) : seq(from, +1).map((t) => F(to) - F(t));
  return G;
}
for (let level = 1; level <= 3; level++) {
  for (let i = 0; i < N; i++) {
    const r = M.rng(5000 * level + i);
    let p;
    try { p = M.generate('imp', level, r); } catch (e) { fail('gen', e.stack.split('\n').slice(0, 3).join(' | ')); continue; }
    count++;
    const key = `imp/${p.family}`; fams[key] = (fams[key] || 0) + 1;
    const I = p.improper;
    // antiderivative matches the integrand where it is defined
    const pts = M.points(p.domain, 9, 11);
    if (!M.derivMatches(I.F, p.f, pts)) fail('deriv:' + key, p.tex);
    // value or divergence from the limits
    const lo = num(I.lo), hi = num(I.hi), w = I.where != null ? num(I.where) : null;
    let pieces;
    if (I.type === 'upper' || I.type === 'lower') pieces = [piece(I.F, lo, hi, I.type === 'upper' ? 'to' : 'from')];
    else if (I.type === 'left') pieces = [piece(I.F, lo, hi, 'from')];
    else if (I.type === 'right') pieces = [piece(I.F, lo, hi, 'to')];
    else if (I.type === 'both') pieces = [piece(I.F, -Infinity, 0, 'from'), piece(I.F, 0, Infinity, 'to')];
    else pieces = [piece(I.F, lo, w, 'to'), piece(I.F, w, hi, 'from')];
    const conv = pieces.map((G) => Math.abs(G[2] - G[1]) < Math.abs(G[1] - G[0]) * 0.6 + 1e-9 && Number.isFinite(G[2]) && Math.abs(G[2]) < 1e3);
    const all = conv.every(Boolean);
    if (all !== I.converges) fail('converges:' + key, `${p.tex} said ${I.converges} got ${conv} ${JSON.stringify(pieces)}`);
    if (all && I.converges) {
      const v = pieces.reduce((s, G) => s + G[2], 0);
      if (Math.abs(v - I.value) > 0.03 * Math.max(1, Math.abs(I.value))) fail('value:' + key, `${p.tex} ${v} vs ${I.value}`);
    }
    // pieces' own values agree with the step checks
    const pieceSteps = p.steps.filter((s) => s.check && s.check.kind === 'improper' && !s.check.final);
    pieceSteps.forEach((s, k) => {
      const G = pieces[k]; const c = conv[k];
      if (c !== s.check.expect.converges) fail('pieceConv:' + key, `${p.tex} piece ${k}`);
      if (c && Math.abs(G[2] - s.check.expect.value) > 0.03 * Math.max(1, Math.abs(s.check.expect.value))) fail('pieceVal:' + key, `${p.tex} piece ${k} ${G[2]} vs ${s.check.expect.value}`);
      const typed = c ? ascii(s.check.answerTex) : 'diverges';
      if (!M.checkImproper(typed, s.check).ok) fail('pieceTyped:' + key, `${typed} for ${s.check.answerTex}`);
      (s.check.mistakes || []).forEach((m) => { if (m.v !== 'conv' && m.v !== 'div' && c && Math.abs(m.v - s.check.expect.value) < 1e-9) fail('pieceMistakeSame:' + key, m.msg); richOK(m.msg, 'pieceMsg ' + key); });
    });
    // exact TeX and its typed form
    texOK(p.tex, 'problem ' + key);
    if (I.converges) {
      texOK(I.exact, 'exact ' + key);
      const typed = ascii(I.exact);
      const g = M.gradeImproper(typed, p);
      if (g.verdict !== 'correct') fail('gradeTyped:' + key, `${typed} (${I.exact}) -> ${g.verdict} ${JSON.stringify(g.notes)}`);
      const gd = M.gradeImproper('diverges', p); if (gd.verdict !== 'wrong' || gd.score > Math.round(p.outOf * 0.3)) fail('gradeDivWrong:' + key, gd.verdict + ' ' + gd.score);
      const gc2 = M.gradeImproper('converges', p); if (gd.score >= gc2.score) fail('wrongCallBeatsRightCall:' + key, gd.score + ' vs ' + gc2.score);
      const gc = M.gradeImproper('converges', p); if (gc.verdict !== 'almost') fail('gradeConvHalf:' + key, gc.verdict);
      const gx = M.gradeImproper(String(I.value.toFixed(3)), p); if (gx.verdict !== 'almost') fail('gradeDecimal:' + key, gx.verdict + ' ' + I.value);
    } else {
      for (const w2 of ['diverges', 'Diverges.', 'DNE', 'infinity', '∞', 'div', 'diverges to infinity']) { const g = M.gradeImproper(w2, p); if (g.verdict !== 'correct') fail('gradeDiv:' + key, w2 + ' -> ' + g.verdict); }
      const g1 = M.gradeImproper('1', p); if (g1.verdict !== 'wrong' || g1.score > Math.round(p.outOf * 0.3)) fail('gradeNumWrong:' + key, g1.verdict + ' ' + g1.score);
      const g2 = M.gradeImproper('converges', p); if (g2.verdict !== 'wrong' || g2.score > Math.round(p.outOf * 0.3)) fail('gradeConvWrong:' + key, g2.verdict + ' ' + g2.score);
    }
    // mistakes: not equal to the truth, diagnosed when typed
    for (const m of p.mistakes) {
      richOK(m.msg, 'mistakeMsg ' + key);
      if (m.tex) texOK(m.tex, 'mistakeTex ' + key);
      if (m.v === 'div' && !I.converges) fail('mistakeIsTruth:' + key, 'div');
      if (typeof m.v === 'number' && I.converges && Math.abs(m.v - I.value) < 1e-9) fail('mistakeIsTruth:' + key, m.tex);
      if (typeof m.v === 'number' && m.tex) { const g = M.gradeImproper(ascii(m.tex), p); if (!g.diagnosis || g.diagnosis.msg !== m.msg) fail('mistakeDiag:' + key, `${m.tex} -> ${ascii(m.tex)} ${g.verdict} ${g.diagnosis && g.diagnosis.msg}`); }
      if (typeof m.v === 'number' && m.tex) { const val = M.compile(M.parse(ascii(m.tex), { vars: [] }).ast)({}); if (Math.abs(val - m.v) > 1e-9 * Math.max(1, Math.abs(m.v))) fail('mistakeTexVal:' + key, `${m.tex} = ${val} vs ${m.v}`); }
    }
    // speech, hints, steps
    if (/[\\{}]/.test(M.speak(p.tex))) fail('speech:' + key, M.speak(p.tex));
    (p.hints || []).forEach((h) => richOK(h, 'hint ' + key));
    if ((p.hints || []).length !== 3) fail('hints:' + key, p.hints.length);
    let total = 0;
    p.steps.forEach((s, si) => {
      richOK(s.think, 'think ' + key);
      (s.lines || []).forEach((l) => texOK(l, `line ${key} #${si}`));
      const c = s.check; if (!c) return;
      total += c.points;
      if (c.kind === 'choice') {
        if (c.options.filter((o) => o.ok).length !== 1) fail('choiceOk:' + key, s.title);
        c.options.forEach((o) => { if (o.tex) texOK(o.tex, 'opt ' + key); if (o.text) richOK(o.text, 'optText ' + key); richOK(o.msg, 'optMsg ' + key); if (!o.ok && !o.msg) fail('optNoMsg:' + key, s.title); });
        richOK(c.prompt, 'prompt ' + key);
        const texts = c.options.map((o) => o.tex || o.text); if (new Set(texts).size !== texts.length) fail('optDup:' + key, texts.join(' | '));
      } else if (c.kind === 'expr') {
        const dp = M.points(c.domain, 8, 3);
        if (!dp.every((x) => Number.isFinite(c.expect(x)))) fail('exprFinite:' + key, s.title + ' ' + JSON.stringify(c.domain));
        texOK(c.answerTex, 'answerTex ' + key);
        for (const m of c.mistakes || []) { if (M.equivConst(m.f, c.expect, dp).ok) fail('stepMistakeSame:' + key, m.msg); if (!dp.some((x) => Number.isFinite(m.f(x)))) fail('stepMistakeNaN:' + key, m.msg); richOK(m.msg, 'stepMsg ' + key); }
      } else if (c.kind === 'improper') { texOK(c.promptTex, 'impPrompt ' + key); texOK(c.answerTex, 'impAns ' + key); }
    });
    if (total !== p.outOf) fail('outOf:' + key, total + ' vs ' + p.outOf);
    if (!p.steps.some((s) => s.check && s.check.kind === 'improper' && s.check.final)) fail('noFinal:' + key, '');
    // multiple choice
    const opts = M.makeMC(p, M.rng(i));
    if (opts.length !== 4) fail('mcLen:' + key, opts.length + ' ' + p.tex);
    if (opts.filter((o) => o.correct).length !== 1) fail('mcCorrect:' + key, '');
    opts.forEach((o) => texOK(o.tex, 'mc ' + key));
    const vals = opts.map((o) => (/Diverges/.test(o.tex) ? 'div' : M.compile(M.parse(ascii(o.tex), { vars: [] }).ast)({}).toFixed(6)));
    if (new Set(vals).size !== 4) fail('mcDup:' + key, opts.map((o) => o.tex).join(' | '));
    if (I.converges && !opts.some((o) => /Diverges/.test(o.tex))) fail('mcNoDiv:' + key, '');
    // pic
    if (!p.pic || !p.pic.x || !p.pic.y) fail('pic:' + key, '');
  }
}
// readImproper sanity
const R = M.readImproper;
const exp = [['diverges', 'div'], ['DIVERGES', 'div'], ['-infinity', 'div'], ['DNE', 'div'], ['converges', 'conv'], ['converges to 1/2', 'num'], ['pi/2', 'num'], ['2sqrt(3)', 'num'], ['ln2', 'num'], ['-9/2', 'num'], ['e^-1', 'num'], ['banana', 'invalid'], ['', 'empty'], ['it diverges', 'div'], ['= 1', 'num']];
for (const [s, k] of exp) if (R(s).kind !== k) fail('read', `${s} -> ${R(s).kind} (want ${k})`);
if (Math.abs(R('converges to 1/2').value - 0.5) > 1e-12) fail('read', 'value');
console.log('problems:', count, 'fails:', fails);
console.log(Object.entries(fams).map(([k, v]) => `${k}:${v}`).join('  '));
console.log(JSON.stringify(errs));
