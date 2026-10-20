/* ==========================================================================
   UNIT 5 — Improper Integrals (7.8)
   Every problem runs the same play: spot the trouble, rewrite with a limit
   (split first when there are two trouble spots), integrate, plug in, take
   the limit, then say "converges to ___" or "diverges".
   Answers are a value or the word "diverges", so mistakes are values too.
   ========================================================================== */
(function (G) {
'use strict';
const M = G.M, st = M.st;
const DIV = 'div';
M.IMP_DIV = DIV;
const Qt = (n, d = 1) => M.Q.tex(M.Q(n, d));

/* ---------------- reading an answer: a number, "diverges", or "converges to N" ---------------- */
const isDiv = (s) => /^(it\s+)?(div|diverge|diverges|divergent)(\s+to\s+[+-]?\s*(∞|inf|infinity|oo))?$/i.test(s)
  || /^[+-]?\s*(∞|inf|infinity|oo)$/i.test(s)
  || /^(dne|d\.n\.e|does\s+not\s+exist|no\s+limit|undefined)$/i.test(s);
M.readImproper = function (src) {
  let s = String(src || '').trim().replace(/[.!]+$/, '').replace(/\s+/g, ' ');
  if (!s) return { kind: 'empty' };
  if (isDiv(s)) {
    const inf = /∞|inf|oo/i.test(s), neg = /^-\s*(∞|inf|oo)/i.test(s) || /to\s+-/i.test(s);
    return { kind: 'div', inf: inf ? (neg ? -1 : 1) : 0, tex: inf ? `${neg ? '-' : ''}\\infty\\;\\text{(diverges)}` : '\\text{Diverges}' };
  }
  let conv = false;
  const m = /^(it\s+)?(converges|converge|convergent|conv)\b\s*(to|=|:|,)?\s*(.*)$/i.exec(s);
  if (m) { conv = true; s = m[4].trim(); if (!s) return { kind: 'conv', tex: '\\text{Converges}' }; }
  const r = M.parse(s, { vars: [] });
  if (!r.ok) return { kind: 'invalid', msg: r.error || 'I could not read that yet.' };
  const v = M.compile(r.ast)({});
  if (!Number.isFinite(v)) return { kind: 'invalid', msg: 'That number is undefined. If the limit blows up, type diverges.' };
  return { kind: 'num', value: v, conv, exactish: !/\d\.\d{3,}/.test(s), tex: (conv ? '\\text{Converges to }' : '') + r.tex };
};
const near = (a, b) => Math.abs(a - b) < 1e-6 * Math.max(1, Math.abs(b));
const findMistake = (list, x) => (list || []).find((m) => (x === DIV || x === 'conv' ? m.v === x : typeof m.v === 'number' && near(x, m.v)));
const fmt = (v) => (Number.isInteger(v) ? String(v) : v.toFixed(4));

/** Step check (one piece, or the final answer). c.expect = {converges, value}. */
M.checkImproper = function (input, c) {
  const r = M.readImproper(input);
  if (r.kind === 'empty') return { ok: false, invalid: true, msg: 'Type a number, or the word diverges.' };
  if (r.kind === 'invalid') return { ok: false, invalid: true, msg: r.msg };
  const e = c.expect;
  if (r.kind === 'div') {
    if (!e.converges) return { ok: true };
    const m = findMistake(c.mistakes, DIV);
    return { ok: false, msg: m ? m.msg : 'This limit settles on a finite number, so it converges.', tag: m ? m.tag : 'imp-limit' };
  }
  if (r.kind === 'conv') return e.converges ? { ok: false, msg: 'Yes, it converges. Now give the number it converges to.', tag: 'imp-value' } : { ok: false, msg: 'This limit does not settle on a number.', tag: 'imp-limit' };
  if (!e.converges) {
    const m = findMistake(c.mistakes, r.value);
    return { ok: false, msg: m ? m.msg : 'That is a number, but this limit blows up. Type diverges.', tag: m ? m.tag : 'imp-limit' };
  }
  if (near(r.value, e.value)) return { ok: true, approx: !r.exactish };
  if (Math.abs(r.value - e.value) <= 5e-3 * Math.max(1, Math.abs(e.value))) return { ok: true, approx: true };
  const m = findMistake(c.mistakes, r.value);
  return { ok: false, msg: m ? m.msg : null, tag: m ? m.tag : null };
};

/** Grade a typed final answer like a professor: right call + right value = full credit. */
M.gradeImproper = function (input, p, outOf) {
  outOf = outOf || p.outOf;
  const I = p.improper;
  const v = String(input || '').trim();
  if (!v) return { verdict: 'blank', score: 0, outOf, notes: [{ ok: false, text: 'Left blank.' }], tags: [] };
  const r = M.readImproper(v);
  if (r.kind === 'invalid') return { verdict: 'invalid', score: 0, outOf, notes: [{ ok: false, text: r.msg }], tags: [], error: r.msg };
  const truth = I.converges ? `It converges to $${I.exact}$.` : 'It diverges.';
  const credit = (m) => (m && m.step != null ? p.steps.slice(0, m.step).reduce((s, x) => s + (x.check ? x.check.points || 0 : 0), 0) : 0);
  // credit for the steps before the slip, but a wrong converge/diverge call never earns more than
  // the right call with no value would (half): it is capped at 30%
  const callCap = Math.round(outOf * 0.3);
  const wrong = (m, lead, base = 0, extra = [], cap = outOf - 3) => {
    const diagnosis = m ? { tag: m.tag, msg: m.msg, step: m.step ?? null } : null;
    return { verdict: 'wrong', score: Math.max(base, Math.min(cap, credit(m))), outOf, notes: [{ ok: false, text: lead }, ...extra], diagnosis, tags: diagnosis ? [diagnosis.tag] : [] };
  };
  if (r.kind === 'div') {
    if (!I.converges) return { verdict: 'correct', score: outOf, outOf, notes: [{ ok: true, text: 'Diverges. Right call.' }], tags: [] };
    return wrong(findMistake(p.mistakes, DIV), `You said it diverges. ${truth}`, 0, [], callCap);
  }
  if (r.kind === 'conv') {
    if (I.converges) return { verdict: 'almost', score: Math.round(outOf / 2), outOf, notes: [{ ok: true, text: 'Converges is the right call.' }, { ok: false, text: `Finish it: the value is $${I.exact}$. (half credit)` }], tags: ['imp-value'] };
    return wrong(findMistake(p.mistakes, 'conv'), `You said it converges. ${truth}`, 0, [], callCap);
  }
  if (!I.converges) return wrong(findMistake(p.mistakes, r.value), `You got ${fmt(r.value)}, but this integral diverges.`, 0, [], callCap);
  if (near(r.value, I.value) && r.exactish) return { verdict: 'correct', score: outOf, outOf, notes: [{ ok: true, text: `Converges to $${I.exact}$. Exact and correct.` }], tags: [] };
  if (Math.abs(r.value - I.value) <= 5e-3 * Math.max(1, Math.abs(I.value))) return { verdict: 'almost', score: outOf - 1, outOf, notes: [{ ok: true, text: 'The value is right.' }, { ok: false, text: `Keep it exact: $${I.exact}$ (−1).` }], tags: ['exact'] };
  return wrong(findMistake(p.mistakes, r.value), `You got ${fmt(r.value)}. ${truth}`, Math.round(outOf * 0.3), [{ ok: true, text: 'Right call that it converges.' }]);
};

/** Multiple choice: the right call, plus wrong answers students really get. */
M.makeMCImp = function (p, rng) {
  rng = rng || M.rng();
  const I = p.improper;
  const key = (v) => (v === DIV ? DIV : Math.round(v * 1e6) / 1e6);
  const opts = [{ tex: I.converges ? I.exact : '\\text{Diverges}', correct: true, k: key(I.converges ? I.value : DIV) }];
  const add = (m) => {
    if (opts.length >= 4 || !m || m.v === 'conv' || !m.tex) return;
    const k = key(m.v); if (opts.some((o) => o.k === k)) return;
    opts.push({ tex: m.tex, correct: false, msg: m.msg, tag: m.tag, k });
  };
  const pool = rng.shuffle((p.mistakes || []).slice());
  if (I.converges) add(pool.find((m) => m.v === DIV) || { v: DIV, tex: '\\text{Diverges}', msg: 'The limit is a finite number, so it converges.', tag: 'imp-limit' });
  pool.forEach(add);
  const why = I.converges ? `Redo the limit step: it converges to $${I.exact}$.` : 'The limit blows up, so it diverges.';
  [[0, '0'], [1, '1'], [-1, '-1'], [2, '2'], [0.5, '\\frac{1}{2}']].forEach(([v, tex]) => add({ v, tex, msg: why, tag: 'imp-limit' }));
  return rng.shuffle(opts).map(({ k, ...o }) => o);
};

/* ---------------- the shared play ---------------- */
const TYPE_TEXT = (s) => {
  const at = s.where;
  return {
    upper: 'The top limit is $\\infty$ (Type 1)',
    lower: 'The bottom limit is $-\\infty$ (Type 1)',
    both: 'Both limits are infinite (Type 1): split it',
    left: at != null ? `It blows up at $x = ${at}$, the left end (Type 2)` : 'It blows up at the left end (Type 2)',
    right: at != null ? `It blows up at $x = ${at}$, the right end (Type 2)` : 'It blows up at the right end (Type 2)',
    interior: at != null ? `It blows up at $x = ${at}$, inside the interval (Type 2): split it` : 'It blows up somewhere inside the interval (Type 2)',
    none: 'Nothing. It is a regular definite integral',
  };
};
function spotOptions(s) {
  const L = TYPE_TEXT(s);
  const W = {
    upper: [['none', 'The top limit is $\\infty$, and $\\infty$ is not a number you can plug in. That makes it improper.'], ['interior', `Scan $[${s.lo}, \\infty)$: nothing there makes the function blow up. The only trouble is the $\\infty$.`]],
    lower: [['upper', 'Look at the bottom limit: it is $-\\infty$.'], ['none', 'The bottom limit is $-\\infty$, so it is improper.']],
    both: [['upper', 'The bottom is $-\\infty$ too. Two infinite ends means split it.'], ['none', 'Both limits are infinite, so it is improper.']],
    left: [['none', `Plug in $x = ${s.where}$: the function blows up there. That end is a vertical asymptote.`], ['interior', `$x = ${s.where}$ is an endpoint, not inside.`]],
    right: [['none', `Plug in $x = ${s.where}$: the function blows up there. That end is a vertical asymptote.`], ['interior', `$x = ${s.where}$ is an endpoint, not inside.`]],
    interior: [['none', `$x = ${s.where}$ sits inside $[${s.lo}, ${s.hi}]$ and the function blows up there. Plugging in blindly gives a wrong answer.`], ['left', `$x = ${s.where}$ is inside the interval, not at an end. Split there.`]],
  }[s.type];
  return [{ text: L[s.type], ok: true }, ...W.map(([k, msg]) => ({ text: L[k], msg }))];
}
const intT = (lo, hi, f) => `\\int_{${lo}}^{${hi}} ${f}\\,dx`;
function setupOptions(s) {
  const f = s.fTex, w = s.where;
  switch (s.type) {
    case 'upper': return [
      { tex: `\\lim_{b\\to\\infty} ${intT(s.lo, 'b', f)}`, ok: true },
      { tex: `F(\\infty) - F(${s.lo})`, msg: '$\\infty$ is not a number you can plug in. Put $b$ in its place and take $\\lim_{b\\to\\infty}$.' },
      { tex: `\\lim_{b\\to 0} ${intT(s.lo, 'b', f)}`, msg: '$b$ stands in for the $\\infty$, so $b \\to \\infty$.' },
    ];
    case 'lower': return [
      { tex: `\\lim_{a\\to-\\infty} ${intT('a', s.hi, f)}`, ok: true },
      { tex: `\\lim_{a\\to\\infty} ${intT('a', s.hi, f)}`, msg: 'The bottom limit is $-\\infty$, so $a \\to -\\infty$.' },
      { tex: `F(${s.hi}) - F(-\\infty)`, msg: 'You cannot plug in $-\\infty$. Put $a$ in its place and take a limit.' },
    ];
    case 'both': return [
      { tex: `\\lim_{a\\to-\\infty} ${intT('a', '0', f)} + \\lim_{b\\to\\infty} ${intT('0', 'b', f)}`, ok: true },
      { tex: `\\lim_{t\\to\\infty} ${intT('-t', 't', f)}`, msg: 'One shared limit can cancel two infinities and hide a divergence. Split at 0 and give each half its own limit.' },
      { tex: 'F(\\infty) - F(-\\infty)', msg: 'Neither end is a number. Split at 0 and take two limits.' },
    ];
    case 'left': return [
      { tex: `\\lim_{t\\to ${w}^{+}} ${intT('t', s.hi, f)}`, ok: true },
      { tex: `\\lim_{t\\to ${w}^{-}} ${intT('t', s.hi, f)}`, msg: `Come at the bad point from inside the interval. Inside is to the right of $${w}$, so $t \\to ${w}^{+}$.` },
      { tex: `F(${s.hi}) - F(${w})`, msg: `$F(${w})$ does not exist: that is the asymptote. Use $t$ and a limit.` },
    ];
    case 'right': return [
      { tex: `\\lim_{t\\to ${w}^{-}} ${intT(s.lo, 't', f)}`, ok: true },
      { tex: `\\lim_{t\\to ${w}^{+}} ${intT(s.lo, 't', f)}`, msg: `Come at the bad point from inside the interval. Inside is to the left of $${w}$, so $t \\to ${w}^{-}$.` },
      { tex: `F(${w}) - F(${s.lo})`, msg: `$F(${w})$ does not exist: that is the asymptote. Use $t$ and a limit.` },
    ];
    default: return [
      { tex: `\\lim_{t\\to ${w}^{-}} ${intT(s.lo, 't', f)} + \\lim_{s\\to ${w}^{+}} ${intT('s', s.hi, f)}`, ok: true },
      { tex: `F(${s.hi}) - F(${s.lo})`, msg: `That is blind integration straight across the asymptote at $x = ${w}$. Split there first.` },
      { tex: `\\lim_{t\\to ${w}} ${intT(s.lo, s.hi, f)}`, msg: `Split at $x = ${w}$ so each piece gets its own one-sided limit.` },
    ];
  }
}
const SPOT_LINE = (s) => s.spot || {
  upper: '\\text{top limit} = \\infty \\;\\Rightarrow\\; \\text{Type 1}',
  lower: '\\text{bottom limit} = -\\infty \\;\\Rightarrow\\; \\text{Type 1}',
  both: '\\text{both limits infinite} \\;\\Rightarrow\\; \\text{Type 1, split at } 0',
  left: `x = ${s.where}\\text{ breaks the function} \\;\\Rightarrow\\; \\text{Type 2, left end}`,
  right: `x = ${s.where}\\text{ breaks the function} \\;\\Rightarrow\\; \\text{Type 2, right end}`,
  interior: `x = ${s.where}\\text{ breaks the function, inside } [${s.lo}, ${s.hi}] \\;\\Rightarrow\\; \\text{split}`,
}[s.type];
const SPOT_THINK = {
  upper: 'Two scans. Limits: the top is $\\infty$. Inside: nothing on the interval makes the function blow up.',
  lower: 'Two scans. Limits: the bottom is $-\\infty$. Inside: nothing on the interval makes the function blow up.',
  both: 'Two scans. Limits: both ends are infinite. One limit per trouble spot, so this needs a split.',
  left: 'Two scans. The limits are regular numbers, but the function blows up at the left end.',
  right: 'Two scans. The limits are regular numbers, but the function blows up at the right end.',
  interior: 'Two scans. The limits are regular numbers, but the function blows up INSIDE the interval. That is the trap: you must split there.',
};
const SETUP_THINK = {
  upper: '$\\infty$ is not a number, so put a letter in its place and take a limit.',
  lower: '$-\\infty$ is not a number, so put a letter in its place and take a limit.',
  both: 'One limit per trouble spot. Split at 0 (any number works), then each half gets its own limit.',
  left: 'Put $t$ where the asymptote is and approach it from inside the interval.',
  right: 'Put $t$ where the asymptote is and approach it from inside the interval.',
  interior: 'Split at the asymptote. Each piece gets its own one-sided limit.',
};
const imp = (o) => ({ kind: 'improper', points: o.points, promptTex: o.promptTex, expect: { converges: o.value !== DIV, value: o.value === DIV ? null : o.value }, mistakes: o.mistakes || [], answerTex: o.value === DIV ? '\\text{Diverges}' : o.exact, exactNote: true, final: !!o.final });

/** spec → problem */
function build(s) {
  const tex = intT(s.lo, s.hi, s.fTex);
  const converges = s.value !== DIV;
  const setup = setupOptions(s);
  const concl = converges ? `${tex} = ${s.exact} \\quad \\text{(converges)}` : `${tex} \\;\\; \\text{diverges}`;
  const steps = [
    { title: 'Spot what makes it improper', think: SPOT_THINK[s.type], lines: [SPOT_LINE(s)], check: st.choice('What makes this integral improper?', spotOptions(s), 2), tag: 'imp-type', pic: true },
    { title: s.pieces.length > 1 ? 'Split it, then write the limits' : 'Rewrite it as a limit', think: SETUP_THINK[s.type], lines: [`${tex} = ${setup[0].tex}`], check: st.choice('Which setup is right?', setup, 2), tag: s.pieces.length > 1 ? 'imp-split' : 'imp-setup' },
    { title: 'Find the antiderivative', think: s.F.think, lines: [`\\int ${s.fTex}\\,dx = ${s.F.tex}`], check: st.expr('F(x) =', { expect: s.F.f, exact: false, domain: s.F.domain, mistakes: s.F.mist || [], points: 3, answerTex: s.F.tex }), tag: s.F.tag || 'power' },
  ];
  if (s.pieces.length === 1) {
    const pc = s.pieces[0];
    steps.push({ title: 'Plug in: top minus bottom', think: 'Write $F(\\text{top}) - F(\\text{bottom})$ with everything plugged in, in parentheses. Simplify after.', lines: pc.plug, check: null, tag: 'imp-plug' });
    steps.push({ title: 'Take the limit, then decide', think: pc.why, lines: pc.lim.concat([concl]), check: imp({ points: 3, promptTex: `${tex} =`, value: s.value, exact: s.exact, mistakes: s.mistakes, final: true }), tag: 'imp-limit' });
  } else {
    s.pieces.forEach((pc, i) => steps.push({
      title: i === 0 ? 'Left piece: plug in, take the limit' : 'Right piece: plug in, take the limit', think: pc.why,
      lines: pc.plug.concat(pc.lim),
      check: imp({ points: 2, promptTex: `\\text{${i === 0 ? 'left' : 'right'} piece} =`, value: pc.value, exact: pc.exact, mistakes: pc.mist }),
      tag: 'imp-limit',
    }));
    steps.push({
      title: 'Put the pieces together', think: converges ? 'Both pieces converge, so add them.' : 'At least one piece diverges, so the whole integral diverges. (No adding needed.)',
      lines: [converges ? `${s.pieces.map((p) => `\\left(${p.exact}\\right)`).join(' + ')} = ${s.exact}` : '\\text{a piece diverges} \\;\\Rightarrow\\; \\text{the whole integral diverges}', concl],
      check: imp({ points: 2, promptTex: `${tex} =`, value: s.value, exact: s.exact, mistakes: s.mistakes, final: true }), tag: 'imp-split',
    });
  }
  return {
    family: s.family, famLabel: s.famLabel, level: s.level,
    tex, f: s.f, domain: s.domain, pic: s.pic,
    improper: { converges, value: converges ? s.value : null, exact: converges ? s.exact : null, type: s.type, where: s.where ?? null, lo: s.lo, hi: s.hi, F: s.F.f },
    answer: { tex: s.F.tex, f: s.F.f, ascii: '', terms: [] },
    mistakes: s.mistakes, hints: s.hints, steps,
  };
}

/* ---------------- Type 1: ∞ on top ---------------- */
const PT = { // ∫ x^{-p}
  2: { fTex: '\\frac{1}{x^{2}}', f: (x) => x ** -2, F: (x) => -1 / x, FTex: '-\\frac{1}{x}', at: (v) => `-\\frac{1}{${v}}`, think: 'Power rule: $\\int x^{-2}dx = \\frac{x^{-1}}{-1} = -\\frac{1}{x}$.', pTex: '2' },
  3: { fTex: '\\frac{1}{x^{3}}', f: (x) => x ** -3, F: (x) => -1 / (2 * x * x), FTex: '-\\frac{1}{2x^{2}}', at: (v) => `-\\frac{1}{2(${v})^{2}}`, think: 'Power rule: $\\int x^{-3}dx = \\frac{x^{-2}}{-2} = -\\frac{1}{2x^{2}}$.', pTex: '3' },
  4: { fTex: '\\frac{1}{x^{4}}', f: (x) => x ** -4, F: (x) => -1 / (3 * x ** 3), FTex: '-\\frac{1}{3x^{3}}', at: (v) => `-\\frac{1}{3(${v})^{3}}`, think: 'Power rule: $\\int x^{-4}dx = \\frac{x^{-3}}{-3} = -\\frac{1}{3x^{3}}$.', pTex: '4' },
  1.5: { fTex: '\\frac{1}{x\\sqrt{x}}', f: (x) => x ** -1.5, F: (x) => -2 / Math.sqrt(x), FTex: '-\\frac{2}{\\sqrt{x}}', at: (v) => `-\\frac{2}{\\sqrt{${v}}}`, think: 'Rewrite $\\frac{1}{x\\sqrt{x}} = x^{-3/2}$. Power rule: $\\frac{x^{-1/2}}{-1/2} = -\\frac{2}{\\sqrt{x}}$.', pTex: '\\frac{3}{2}' },
  0.5: { fTex: '\\frac{1}{\\sqrt{x}}', f: (x) => x ** -0.5, F: (x) => 2 * Math.sqrt(x), FTex: '2\\sqrt{x}', at: (v) => `2\\sqrt{${v}}`, think: 'Rewrite $\\frac{1}{\\sqrt{x}} = x^{-1/2}$. Power rule: $\\frac{x^{1/2}}{1/2} = 2\\sqrt{x}$.', pTex: '\\frac{1}{2}' },
  1: { fTex: '\\frac{1}{x}', f: (x) => 1 / x, F: (x) => Math.log(x), FTex: '\\ln x', at: (v) => `\\ln ${v}`, think: '$\\int\\frac{1}{x}dx = \\ln|x|$, and $x > 0$ here, so it is $\\ln x$.', pTex: '1' },
};
function p_inf(level, r, fx = {}) {
  const p = fx.p ?? r.pickW([[2, 4], [3, 2], [1.5, 2], [0.5, 2], [1, 3], [4, 1]]);
  const a = fx.a ?? (level >= 2 && (p === 2 || p === 3) && r.chance(0.6) ? 2 : 1);
  const E = PT[p];
  const s = { family: 'p_inf', famLabel: '1/xᵖ out to ∞', level: 1, lo: String(a), hi: '\\infty', fTex: E.fTex, f: E.f, type: 'upper', domain: [a, a + 6], pic: { x: [0, 8.5], y: [0, 1.6], from: a, to: 8.5, tail: 'right' } };
  s.F = { tex: E.FTex, f: E.F, think: E.think, domain: [1, 4], mist: p === 1 ? [{ f: (x) => -1 / x, msg: '$-\\frac{1}{x}$ is the antiderivative of $\\frac{1}{x^{2}}$. For $\\frac{1}{x}$ it is $\\ln x$.', tag: 'power' }] : [{ f: (x) => (x ** (-p - 1)) / (-p - 1), msg: 'Power rule ADDS 1 to the power, then divides by the new power.', tag: 'power' }, { f: (x) => -E.F(x), msg: 'Sign: divide by the new power, which is negative here.', tag: 'sign' }] };
  if (p > 1) {
    const value = 1 / ((p - 1) * a ** (p - 1));
    const exact = p === 1.5 ? '2' : Qt(1, (p - 1) * a ** (p - 1));
    const Fa = E.at(a);
    const wrongV = 1 / ((p + 1) * a ** (p + 1));
    const wrongT = p === 1.5 ? '\\frac{2}{5}' : Qt(1, (p + 1) * a ** (p + 1));
    s.value = value; s.exact = exact;
    s.pieces = [{ plug: [`\\left(${E.at('b')}\\right) - \\left(${Fa}\\right) = ${E.at('b')} + ${exact}`], lim: [`\\lim_{b\\to\\infty}\\left(${E.at('b')} + ${exact}\\right) = 0 + ${exact} = ${exact}`], why: `As $b \\to \\infty$, $${E.at('b')} \\to 0$ (a fixed number over something huge).` }];
    s.mistakes = [
      { v: DIV, tex: '\\text{Diverges}', msg: `$p = ${E.pTex} > 1$, so it converges (p-test). The $b$ part goes to 0; nothing blows up.`, tag: 'p-test', step: 4 },
      { v: -value, tex: '-' + exact, msg: 'Sign slip: top minus bottom is $F(b) - F(a)$, and minus a negative is a plus.', tag: 'sign', step: 3 },
      { v: wrongV, tex: wrongT, msg: 'Power rule ADDS 1 to the power: the antiderivative of $x^{-p}$ is $\\frac{x^{-p+1}}{-p+1}$.', tag: 'power', step: 2 },
    ];
    s.hints = ['The top limit is $\\infty$: swap it for $b$ and take $\\lim_{b\\to\\infty}$.', `Antiderivative: $${E.FTex}$.`, `Plug in: $\\left(${E.at('b')}\\right) - \\left(${Fa}\\right)$. The $b$ part goes to 0.`];
  } else {
    s.value = DIV;
    s.pieces = p === 1
      ? [{ plug: ['\\ln b - \\ln 1 = \\ln b - 0'], lim: ['\\lim_{b\\to\\infty} \\ln b = \\infty'], why: '$\\ln b$ grows forever: slowly, but forever.' }]
      : [{ plug: ['2\\sqrt{b} - 2\\sqrt{1} = 2\\sqrt{b} - 2'], lim: ['\\lim_{b\\to\\infty}\\left(2\\sqrt{b} - 2\\right) = \\infty'], why: '$\\sqrt{b}$ grows without bound, so the limit is $\\infty$.' }];
    s.mistakes = p === 1 ? [
      { v: 0, tex: '0', msg: '$\\frac{1}{x} \\to 0$ does not mean the area stops growing. $\\ln b \\to \\infty$, so it diverges.', tag: 'imp-limit', step: 4 },
      { v: 1, tex: '1', msg: '$-\\frac{1}{x}$ is the antiderivative of $\\frac{1}{x^{2}}$. For $\\frac{1}{x}$ it is $\\ln x$, which never levels off.', tag: 'power', step: 2 },
      { v: 'conv', msg: '$p = 1$ is exactly the edge of the p-test, and the edge diverges (you need $p > 1$).', tag: 'p-test', step: 4 },
    ] : [
      { v: -2, tex: '-2', msg: '$\\sqrt{b}$ does not go to 0. It grows without bound. Only negative powers of $b$ shrink.', tag: 'imp-limit', step: 4 },
      { v: 2, tex: '2', msg: 'That is the near-0 rule. Out to $\\infty$ you need $p > 1$, and $p = \\frac{1}{2}$ is not.', tag: 'p-test', step: 4 },
      { v: 'conv', msg: '$p = \\frac{1}{2} \\le 1$, so it diverges out to $\\infty$.', tag: 'p-test', step: 4 },
    ];
    s.hints = ['The top limit is $\\infty$: swap it for $b$ and take $\\lim_{b\\to\\infty}$.', `Antiderivative: $${E.FTex}$.`, `Watch what $${E.at('b')}$ does as $b \\to \\infty$.`];
  }
  return build(s);
}
function exp_inf(level, r, fx = {}) {
  const k = fx.k ?? r.pick([1, 2, 3, 1, 2]);
  const lo = fx.lo ?? (k === 1 && r.chance(0.35) ? r.pick([1, 2]) : 0);
  const kT = k === 1 ? '' : k;
  const at = (v) => (k === 1 ? `-e^{-${v}}` : `-\\frac{1}{${k}}e^{-${k}${v}}`);
  const value = Math.exp(-k * lo) / k;
  const exact = lo === 0 ? Qt(1, k) : lo === 1 ? '\\frac{1}{e}' : '\\frac{1}{e^{2}}';
  const s = { family: 'exp_inf', famLabel: 'e^{−kx} out to ∞', level: 1, lo: String(lo), hi: '\\infty', fTex: `e^{-${kT}x}`, f: (x) => Math.exp(-k * x), type: 'upper', domain: [lo, lo + 4], pic: { x: [lo - 0.6, lo + 5], y: [0, Math.exp(-k * lo) * 1.25], from: lo, to: lo + 5, tail: 'right' } };
  s.F = { tex: k === 1 ? '-e^{-x}' : `-\\frac{1}{${k}}e^{-${k}x}`, f: (x) => -Math.exp(-k * x) / k, think: `Integrating divides by the number next to $x$, which is $-${k}$: $\\int e^{-${kT}x}dx = ${k === 1 ? '-e^{-x}' : `-\\frac{1}{${k}}e^{-${k}x}`}$.`, domain: [0, 2], tag: 'kfactor', mist: [{ f: (x) => Math.exp(-k * x) / k, msg: 'Sign: the inside $-' + kT + 'x$ brings a minus.', tag: 'sign' }].concat(k === 1 ? [] : [{ f: (x) => -k * Math.exp(-k * x), msg: `Integrating DIVIDES by ${k}. Multiplying is what differentiating does.`, tag: 'kfactor' }]) };
  s.value = value; s.exact = exact;
  const FloT = lo === 0 ? (k === 1 ? '-e^{0}' : `-\\frac{1}{${k}}e^{0}`) : at(lo);
  s.pieces = [{ plug: [`\\left(${at('b')}\\right) - \\left(${FloT}\\right) = ${at('b')} + ${exact}`], lim: [`\\lim_{b\\to\\infty}\\left(${at('b')} + ${exact}\\right) = 0 + ${exact} = ${exact}`], why: `$e^{-${kT}b} = \\frac{1}{e^{${kT}b}}$, and $e^{${kT}b}$ is huge, so it goes to 0.` }];
  s.mistakes = [
    { v: DIV, tex: '\\text{Diverges}', msg: `$e^{-${kT}b} = \\frac{1}{e^{${kT}b}}$ shrinks to 0. Nothing blows up, so it converges.`, tag: 'imp-limit', step: 4 },
    { v: -value, tex: '-' + exact, msg: 'Sign slip: $F(b) - F(a)$, and minus a negative is a plus.', tag: 'sign', step: 3 },
    lo === 0 ? (k === 1 ? { v: 0, tex: '0', msg: '$e^{0} = 1$, not 0.', tag: 'algebra', step: 3 } : { v: k, tex: String(k), msg: `Integrating DIVIDES by ${k}: $\\int e^{-${k}x}dx = -\\frac{1}{${k}}e^{-${k}x}$.`, tag: 'kfactor', step: 2 })
      : { v: Math.exp(lo), tex: lo === 1 ? 'e' : 'e^{2}', msg: `$e^{-${lo}} = \\frac{1}{${lo === 1 ? 'e' : 'e^{2}'}}$, not $${lo === 1 ? 'e' : 'e^{2}'}$.`, tag: 'algebra', step: 3 },
  ];
  s.hints = ['The top limit is $\\infty$: swap it for $b$ and take $\\lim_{b\\to\\infty}$.', `Antiderivative: $${s.F.tex}$.`, `$e^{-${kT}b} \\to 0$ as $b \\to \\infty$.`];
  return build(s);
}

/* ---------------- Type 1: −∞ on the bottom ---------------- */
function exp_neg_inf(level, r, fx = {}) {
  const variant = fx.variant ?? (r.chance(0.7) ? 'exp' : 'pow');
  if (variant === 'pow') {
    const s = { family: 'exp_neg_inf', famLabel: '−∞ on the bottom', level: 1, lo: '-\\infty', hi: '-1', fTex: '\\frac{1}{x^{2}}', f: (x) => x ** -2, type: 'lower', domain: [-5, -1], pic: { x: [-8.5, 0], y: [0, 1.6], from: -8.5, to: -1, tail: 'left' } };
    s.F = { tex: '-\\frac{1}{x}', f: (x) => -1 / x, think: 'Power rule: $\\int x^{-2}dx = -\\frac{1}{x}$.', domain: [-4, -1], mist: [{ f: (x) => 1 / x, msg: 'Sign: $\\frac{x^{-1}}{-1} = -\\frac{1}{x}$.', tag: 'sign' }] };
    s.value = 1; s.exact = '1';
    s.pieces = [{ plug: ['\\left(-\\frac{1}{-1}\\right) - \\left(-\\frac{1}{a}\\right) = 1 + \\frac{1}{a}'], lim: ['\\lim_{a\\to-\\infty}\\left(1 + \\frac{1}{a}\\right) = 1 + 0 = 1'], why: 'As $a \\to -\\infty$, $\\frac{1}{a} \\to 0$.' }];
    s.mistakes = [
      { v: DIV, tex: '\\text{Diverges}', msg: '$\\frac{1}{x^{2}}$ has $p = 2 > 1$, so the tail converges. And $\\frac{1}{a} \\to 0$.', tag: 'p-test', step: 4 },
      { v: -1, tex: '-1', msg: '$-\\frac{1}{-1} = +1$. Two negatives make a positive.', tag: 'sign', step: 3 },
      { v: 2, tex: '2', msg: '$\\frac{1}{a} \\to 0$ as $a \\to -\\infty$, so only the 1 is left.', tag: 'imp-limit', step: 4 },
    ];
    s.hints = ['The bottom is $-\\infty$: swap it for $a$ and take $\\lim_{a\\to-\\infty}$.', 'Antiderivative: $-\\frac{1}{x}$.', '$\\frac{1}{a} \\to 0$ as $a \\to -\\infty$.'];
    return build(s);
  }
  const k = fx.k ?? r.pick([1, 2, 3, 1]);
  const kT = k === 1 ? '' : k;
  const at = (v) => (k === 1 ? `e^{${v}}` : `\\frac{1}{${k}}e^{${k}${v}}`);
  const exact = Qt(1, k);
  const s = { family: 'exp_neg_inf', famLabel: '−∞ on the bottom', level: 1, lo: '-\\infty', hi: '0', fTex: `e^{${kT}x}`, f: (x) => Math.exp(k * x), type: 'lower', domain: [-3, 0], pic: { x: [-5, 0.6], y: [0, 1.25], from: -5, to: 0, tail: 'left' } };
  s.F = { tex: k === 1 ? 'e^{x}' : `\\frac{1}{${k}}e^{${k}x}`, f: (x) => Math.exp(k * x) / k, think: k === 1 ? '$e^{x}$ is its own antiderivative.' : `Integrating divides by the number next to $x$: $\\int e^{${k}x}dx = \\frac{1}{${k}}e^{${k}x}$.`, domain: [-2, 0], tag: 'kfactor', mist: k === 1 ? [] : [{ f: (x) => k * Math.exp(k * x), msg: `Integrating DIVIDES by ${k}.`, tag: 'kfactor' }] };
  s.value = 1 / k; s.exact = exact;
  s.pieces = [{ plug: [`\\left(${k === 1 ? 'e^{0}' : `\\frac{1}{${k}}e^{0}`}\\right) - \\left(${at('a')}\\right) = ${exact} - ${at('a')}`], lim: [`\\lim_{a\\to-\\infty}\\left(${exact} - ${at('a')}\\right) = ${exact} - 0 = ${exact}`], why: `As $a \\to -\\infty$, $e^{${kT}a}$ is $e$ to a huge negative power: it goes to 0.` }];
  s.mistakes = [
    { v: DIV, tex: '\\text{Diverges}', msg: `$e^{${kT}a} \\to 0$ as $a \\to -\\infty$. Nothing blows up, so it converges.`, tag: 'imp-limit', step: 4 },
    { v: -1 / k, tex: '-' + exact, msg: 'Top minus bottom: $F(0) - F(a)$.', tag: 'sign', step: 3 },
    k === 1 ? { v: 0, tex: '0', msg: '$e^{0} = 1$, not 0.', tag: 'algebra', step: 3 } : { v: k, tex: String(k), msg: `Integrating DIVIDES by ${k}.`, tag: 'kfactor', step: 2 },
  ];
  s.hints = ['The bottom is $-\\infty$: swap it for $a$ and take $\\lim_{a\\to-\\infty}$.', `Antiderivative: $${s.F.tex}$.`, `$e^{${kT}a} \\to 0$ as $a \\to -\\infty$.`];
  return build(s);
}

/* ---------------- Type 2: blows up at the left end x = 0 (p-test near 0) ---------------- */
const PZ = {
  0.5: { fTex: '\\frac{1}{\\sqrt{x}}', f: (x) => x ** -0.5, F: (x) => 2 * Math.sqrt(x), FTex: '2\\sqrt{x}', at: (v) => `2\\sqrt{${v}}`, top: '2', value: 2, pTex: '\\frac{1}{2}', think: 'Rewrite $\\frac{1}{\\sqrt{x}} = x^{-1/2}$. Power rule: $\\frac{x^{1/2}}{1/2} = 2\\sqrt{x}$.', slip: [1, '1', 'Power rule: $\\frac{x^{1/2}}{1/2} = 2\\sqrt{x}$. Dividing by $\\frac{1}{2}$ doubles it.'] },
  [1 / 3]: { fTex: '\\frac{1}{\\sqrt[3]{x}}', f: (x) => x ** (-1 / 3), F: (x) => 1.5 * x ** (2 / 3), FTex: '\\frac{3}{2}x^{2/3}', at: (v) => `\\frac{3}{2}(${v})^{2/3}`, top: '\\frac{3}{2}', value: 1.5, pTex: '\\frac{1}{3}', think: 'Rewrite $\\frac{1}{\\sqrt[3]{x}} = x^{-1/3}$. Power rule: $\\frac{x^{2/3}}{2/3} = \\frac{3}{2}x^{2/3}$.', slip: [2 / 3, '\\frac{2}{3}', 'Divide by the new power $\\frac{2}{3}$, which means multiply by $\\frac{3}{2}$.'] },
  [2 / 3]: { fTex: '\\frac{1}{x^{2/3}}', f: (x) => x ** (-2 / 3), F: (x) => 3 * Math.cbrt(x), FTex: '3\\sqrt[3]{x}', at: (v) => `3\\sqrt[3]{${v}}`, top: '3', value: 3, pTex: '\\frac{2}{3}', think: 'Rewrite $\\frac{1}{x^{2/3}} = x^{-2/3}$. Power rule: $\\frac{x^{1/3}}{1/3} = 3\\sqrt[3]{x}$.', slip: [1 / 3, '\\frac{1}{3}', 'Divide by the new power $\\frac{1}{3}$, which means multiply by 3.'] },
};
function p_zero(level, r, fx = {}) {
  const p = fx.p ?? r.pickW([[0.5, 4], [1 / 3, 2], [2 / 3, 2], [1, 3], [2, 2]]);
  const s = { family: 'p_zero', famLabel: 'blows up at x = 0', level: 1, lo: '0', hi: '1', type: 'left', where: '0', domain: [0.25, 1], pic: { x: [-0.15, 1.5], y: [0, 5], from: 0, to: 1, asym: [0] } };
  if (p < 1) {
    const E = PZ[p];
    Object.assign(s, { fTex: E.fTex, f: E.f, value: E.value, exact: E.top });
    s.spot = 'x = 0 \\text{ makes the bottom } 0 \\;\\Rightarrow\\; \\text{asymptote at the left end}';
    s.F = { tex: E.FTex, f: E.F, think: E.think, domain: [0.3, 2], mist: [{ f: (x) => E.slip[0] * E.F(x) / E.value, msg: E.slip[2], tag: 'power' }] };
    s.pieces = [{ plug: [`${E.at(1)} - ${E.at('t')} = ${E.top} - ${E.at('t')}`], lim: [`\\lim_{t\\to 0^{+}}\\left(${E.top} - ${E.at('t')}\\right) = ${E.top} - 0 = ${E.top}`], why: `As $t \\to 0^{+}$, $${E.at('t')} \\to 0$.` }];
    s.mistakes = [
      { v: DIV, tex: '\\text{Diverges}', msg: `Near 0 the p-test flips: $p = ${E.pTex} < 1$ converges. (Out at $\\infty$ you would need $p > 1$.)`, tag: 'p-test', step: 4 },
      { v: -E.value, tex: '-' + E.top, msg: 'Top minus bottom: $F(1) - F(t)$.', tag: 'sign', step: 3 },
      { v: E.slip[0], tex: E.slip[1], msg: E.slip[2], tag: 'power', step: 2 },
    ];
    s.hints = ['It blows up at $x = 0$, the left end. Replace 0 with $t$ and take $t \\to 0^{+}$.', `Antiderivative: $${E.FTex}$.`, `$${E.at('t')} \\to 0$ as $t \\to 0^{+}$.`];
    return build(s);
  }
  s.value = DIV;
  if (p === 1) {
    Object.assign(s, { fTex: '\\frac{1}{x}', f: (x) => 1 / x });
    s.spot = 'x = 0 \\text{ makes the bottom } 0 \\;\\Rightarrow\\; \\text{asymptote at the left end}';
    s.F = { tex: '\\ln x', f: (x) => Math.log(x), think: '$\\int\\frac{1}{x}dx = \\ln|x|$, and $x > 0$ here.', domain: [0.3, 2], mist: [{ f: (x) => -1 / x, msg: '$-\\frac{1}{x}$ is for $\\frac{1}{x^{2}}$. For $\\frac{1}{x}$ it is $\\ln x$.', tag: 'power' }] };
    s.pieces = [{ plug: ['\\ln 1 - \\ln t = -\\ln t'], lim: ['\\lim_{t\\to 0^{+}} \\left(-\\ln t\\right) = \\infty'], why: 'As $t \\to 0^{+}$, $\\ln t \\to -\\infty$, so $-\\ln t \\to \\infty$.' }];
    s.mistakes = [
      { v: 0, tex: '0', msg: '$\\ln 0$ does not exist, so you cannot plug in 0. With $t \\to 0^{+}$, $-\\ln t \\to \\infty$.', tag: 'imp-limit', step: 4 },
      { v: 1, tex: '1', msg: 'That uses the antiderivative of $\\frac{1}{x^{2}}$. For $\\frac{1}{x}$ it is $\\ln x$, and $-\\ln t \\to \\infty$.', tag: 'power', step: 2 },
      { v: 'conv', msg: '$p = 1$ diverges near 0 too.', tag: 'p-test', step: 4 },
    ];
    s.hints = ['It blows up at $x = 0$. Replace 0 with $t$, take $t \\to 0^{+}$.', 'Antiderivative: $\\ln x$.', 'What does $\\ln t$ do as $t \\to 0^{+}$?'];
  } else {
    Object.assign(s, { fTex: '\\frac{1}{x^{2}}', f: (x) => x ** -2 });
    s.spot = 'x = 0 \\text{ makes the bottom } 0 \\;\\Rightarrow\\; \\text{asymptote at the left end}';
    s.F = { tex: '-\\frac{1}{x}', f: (x) => -1 / x, think: 'Power rule: $\\int x^{-2}dx = -\\frac{1}{x}$.', domain: [0.3, 2], mist: [{ f: (x) => 1 / x, msg: 'Sign: $\\frac{x^{-1}}{-1} = -\\frac{1}{x}$.', tag: 'sign' }] };
    s.pieces = [{ plug: ['\\left(-\\frac{1}{1}\\right) - \\left(-\\frac{1}{t}\\right) = -1 + \\frac{1}{t}'], lim: ['\\lim_{t\\to 0^{+}}\\left(-1 + \\frac{1}{t}\\right) = \\infty'], why: 'As $t \\to 0^{+}$, $\\frac{1}{t}$ is 1 over a tiny positive number: huge.' }];
    s.mistakes = [
      { v: -1, tex: '-1', msg: 'You only used the top: $-\\frac{1}{1} = -1$. The bottom end blows up: $\\frac{1}{t} \\to \\infty$.', tag: 'imp-limit', step: 4 },
      { v: 1, tex: '1', msg: 'That is the rule for $\\infty$ ($p > 1$ converges there). Near 0 it flips: $p = 2 \\ge 1$ diverges.', tag: 'p-test', step: 4 },
      { v: 'conv', msg: 'Near 0 the p-test flips: $p = 2 \\ge 1$ diverges.', tag: 'p-test', step: 4 },
    ];
    s.hints = ['It blows up at $x = 0$. Replace 0 with $t$, take $t \\to 0^{+}$.', 'Antiderivative: $-\\frac{1}{x}$.', 'What does $\\frac{1}{t}$ do as $t \\to 0^{+}$?'];
  }
  return build(s);
}

/* ---------------- Type 2 at an endpoint, shifted ---------------- */
function endpoint_root(level, r, fx = {}) {
  const variant = fx.variant ?? (level >= 3 ? r.pick(['div', 'right', 'left']) : r.pick(['right', 'left', 'right', 'left', 'div']));
  if (variant === 'right') {
    const m = fx.m ?? r.pick([1, 4, 9, 3]);
    const val = 2 * Math.sqrt(m), vT = m === 3 ? '2\\sqrt{3}' : String(2 * Math.sqrt(m)), halfT = m === 3 ? '\\sqrt{3}' : String(Math.sqrt(m));
    const s = { family: 'endpoint_root', famLabel: 'asymptote at the right end', level: 2, lo: '0', hi: String(m), fTex: `\\frac{1}{\\sqrt{${m} - x}}`, f: (x) => 1 / Math.sqrt(m - x), type: 'right', where: String(m), domain: [0, m * 0.7], pic: { x: [-0.4, m + 0.6], y: [0, Math.max(3, 3 / Math.sqrt(m) * 2.2)], from: 0, to: m, asym: [m] } };
    s.spot = `x = ${m} \\text{ makes } \\sqrt{${m} - x} = 0 \\;\\Rightarrow\\; \\text{asymptote at the right end}`;
    s.F = { tex: `-2\\sqrt{${m} - x}`, f: (x) => -2 * Math.sqrt(m - x), think: `u-sub with $u = ${m} - x$, $du = -dx$: $\\int u^{-1/2}(-du) = -2\\sqrt{u} = -2\\sqrt{${m} - x}$.`, domain: [0, m * 0.6], tag: 'usub', mist: [{ f: (x) => 2 * Math.sqrt(m - x), msg: `The inside $${m} - x$ has derivative $-1$, which flips the sign.`, tag: 'sign' }, { f: (x) => -Math.sqrt(m - x), msg: 'Power rule: $\\frac{u^{1/2}}{1/2} = 2\\sqrt{u}$. Keep the 2.', tag: 'power' }] };
    s.value = val; s.exact = vT;
    s.pieces = [{ plug: [`\\left(-2\\sqrt{${m} - t}\\right) - \\left(-2\\sqrt{${m} - 0}\\right) = -2\\sqrt{${m} - t} + ${vT}`], lim: [`\\lim_{t\\to ${m}^{-}}\\left(-2\\sqrt{${m} - t} + ${vT}\\right) = 0 + ${vT} = ${vT}`], why: `As $t \\to ${m}^{-}$, $${m} - t \\to 0$, so $\\sqrt{${m} - t} \\to 0$.` }];
    s.mistakes = [
      { v: DIV, tex: '\\text{Diverges}', msg: 'It blows up like $\\frac{1}{\\sqrt{u}}$, which is $p = \\frac{1}{2} < 1$. Those converge near the asymptote.', tag: 'p-test', step: 4 },
      { v: -val, tex: '-' + vT, msg: `The inside $${m} - x$ has derivative $-1$: $F = -2\\sqrt{${m} - x}$, and minus a negative is a plus.`, tag: 'sign', step: 2 },
      { v: val / 2, tex: halfT, msg: 'Power rule: $\\frac{u^{1/2}}{1/2} = 2\\sqrt{u}$. Keep the 2.', tag: 'power', step: 2 },
    ];
    s.hints = [`It blows up at $x = ${m}$, the right end. Use $t \\to ${m}^{-}$.`, `u-sub $u = ${m} - x$: antiderivative $-2\\sqrt{${m} - x}$.`, `$\\sqrt{${m} - t} \\to 0$ as $t \\to ${m}^{-}$.`];
    return build(s);
  }
  if (variant === 'left') {
    const a = fx.a ?? r.pick([1, 2, 3]), m = fx.m ?? r.pick([1, 4, 9]);
    const val = 2 * Math.sqrt(m), vT = String(val);
    const s = { family: 'endpoint_root', famLabel: 'asymptote at the left end', level: 2, lo: String(a), hi: String(a + m), fTex: `\\frac{1}{\\sqrt{x - ${a}}}`, f: (x) => 1 / Math.sqrt(x - a), type: 'left', where: String(a), domain: [a + 0.3 * m, a + m], pic: { x: [a - 0.5, a + m + 0.6], y: [0, Math.max(3, 3 / Math.sqrt(m) * 2.2)], from: a, to: a + m, asym: [a] } };
    s.spot = `x = ${a} \\text{ makes } \\sqrt{x - ${a}} = 0 \\;\\Rightarrow\\; \\text{asymptote at the left end}`;
    s.F = { tex: `2\\sqrt{x - ${a}}`, f: (x) => 2 * Math.sqrt(x - a), think: `u-sub with $u = x - ${a}$: $\\int u^{-1/2}du = 2\\sqrt{u} = 2\\sqrt{x - ${a}}$.`, domain: [a + 0.3, a + m], tag: 'usub', mist: [{ f: (x) => Math.sqrt(x - a), msg: 'Power rule: $\\frac{u^{1/2}}{1/2} = 2\\sqrt{u}$. Keep the 2.', tag: 'power' }] };
    s.value = val; s.exact = vT;
    s.pieces = [{ plug: [`2\\sqrt{${a + m} - ${a}} - 2\\sqrt{t - ${a}} = ${vT} - 2\\sqrt{t - ${a}}`], lim: [`\\lim_{t\\to ${a}^{+}}\\left(${vT} - 2\\sqrt{t - ${a}}\\right) = ${vT} - 0 = ${vT}`], why: `As $t \\to ${a}^{+}$, $t - ${a} \\to 0$, so $\\sqrt{t - ${a}} \\to 0$.` }];
    s.mistakes = [
      { v: DIV, tex: '\\text{Diverges}', msg: 'It blows up like $\\frac{1}{\\sqrt{u}}$ ($p = \\frac{1}{2} < 1$). Those converge.', tag: 'p-test', step: 4 },
      { v: -val, tex: '-' + vT, msg: 'Top minus bottom: $F(\\text{top}) - F(t)$.', tag: 'sign', step: 3 },
      { v: val / 2, tex: String(val / 2), msg: 'Power rule: $\\frac{u^{1/2}}{1/2} = 2\\sqrt{u}$. Keep the 2.', tag: 'power', step: 2 },
    ];
    s.hints = [`It blows up at $x = ${a}$, the left end. Use $t \\to ${a}^{+}$.`, `Antiderivative: $2\\sqrt{x - ${a}}$.`, `$\\sqrt{t - ${a}} \\to 0$ as $t \\to ${a}^{+}$.`];
    return build(s);
  }
  // diverges: 1/(x − a)²
  const a = fx.a ?? r.pick([1, 2]), m = fx.m ?? r.pick([1, 2, 3]);
  const s = { family: 'endpoint_root', famLabel: 'asymptote at the left end', level: 3, lo: String(a), hi: String(a + m), fTex: `\\frac{1}{(x - ${a})^{2}}`, f: (x) => (x - a) ** -2, type: 'left', where: String(a), domain: [a + 0.4, a + m], pic: { x: [a - 0.5, a + m + 0.6], y: [0, 5], from: a, to: a + m, asym: [a] } };
  s.spot = `x = ${a} \\text{ makes the bottom } 0 \\;\\Rightarrow\\; \\text{asymptote at the left end}`;
  s.F = { tex: `-\\frac{1}{x - ${a}}`, f: (x) => -1 / (x - a), think: `Power rule on $(x - ${a})^{-2}$: $\\frac{(x-${a})^{-1}}{-1} = -\\frac{1}{x - ${a}}$.`, domain: [a + 0.4, a + 3], mist: [{ f: (x) => 1 / (x - a), msg: 'Sign: dividing by $-1$ brings a minus.', tag: 'sign' }, { f: (x) => Math.log(Math.abs(x - a)), msg: 'It is squared, so it is NOT a log. Power rule.', tag: 'power' }] };
  s.value = DIV;
  const mT = m === 1 ? '' : `{${m}}`;
  s.pieces = [{ plug: [`\\left(-\\frac{1}{${a + m} - ${a}}\\right) - \\left(-\\frac{1}{t - ${a}}\\right) = -\\frac{1}${m === 1 ? '{1}' : mT} + \\frac{1}{t - ${a}}`], lim: [`\\lim_{t\\to ${a}^{+}}\\left(-\\frac{1}${m === 1 ? '{1}' : mT} + \\frac{1}{t - ${a}}\\right) = \\infty`], why: `As $t \\to ${a}^{+}$, $t - ${a}$ is a tiny positive number, so $\\frac{1}{t - ${a}}$ is huge.` }];
  s.mistakes = [
    { v: -1 / m, tex: m === 1 ? '-1' : `-\\frac{1}{${m}}`, msg: `You only plugged in the top. At the bottom, $\\frac{1}{t - ${a}} \\to \\infty$.`, tag: 'imp-limit', step: 4 },
    { v: 1 / m, tex: m === 1 ? '1' : `\\frac{1}{${m}}`, msg: 'That skips the limit at the bad end. $\\frac{1}{t - ' + a + '} \\to \\infty$, so it diverges.', tag: 'imp-limit', step: 4 },
    { v: 'conv', msg: 'It blows up like $\\frac{1}{u^{2}}$: $p = 2 \\ge 1$, which diverges near the asymptote.', tag: 'p-test', step: 4 },
  ];
  s.hints = [`It blows up at $x = ${a}$, the left end. Use $t \\to ${a}^{+}$.`, `Antiderivative: $-\\frac{1}{x - ${a}}$.`, `What does $\\frac{1}{t - ${a}}$ do as $t \\to ${a}^{+}$?`];
  return build(s);
}

/* ---------------- Type 1 with arctan ---------------- */
function arctan_inf(level, r, fx = {}) {
  const variant = fx.variant ?? (r.chance(0.25) ? 'from1' : 'from0');
  if (variant === 'from1') {
    const s = { family: 'arctan_inf', famLabel: 'arctan out to ∞', level: 2, lo: '1', hi: '\\infty', fTex: '\\frac{1}{x^{2}+1}', f: (x) => 1 / (x * x + 1), type: 'upper', domain: [1, 6], pic: { x: [-0.3, 8.5], y: [0, 1.15], from: 1, to: 8.5, tail: 'right' } };
    s.F = { tex: '\\arctan x', f: Math.atan, think: '$\\int\\frac{dx}{x^{2}+1} = \\arctan x$.', domain: [0, 3], tag: 'usub', mist: [{ f: (x) => Math.log(x * x + 1), msg: 'No $x$ on top, so it is not a log. $\\frac{1}{x^{2}+1}$ gives arctan.', tag: 'usub' }] };
    s.value = Math.PI / 4; s.exact = '\\frac{\\pi}{4}';
    s.pieces = [{ plug: ['\\arctan b - \\arctan 1 = \\arctan b - \\frac{\\pi}{4}'], lim: ['\\lim_{b\\to\\infty}\\left(\\arctan b - \\frac{\\pi}{4}\\right) = \\frac{\\pi}{2} - \\frac{\\pi}{4} = \\frac{\\pi}{4}'], why: 'arctan levels off: as $b \\to \\infty$, $\\arctan b \\to \\frac{\\pi}{2}$.' }];
    s.mistakes = [
      { v: Math.PI / 2, tex: '\\frac{\\pi}{2}', msg: 'Subtract the bottom too: $F(1) = \\arctan 1 = \\frac{\\pi}{4}$.', tag: 'imp-plug', step: 3 },
      { v: DIV, tex: '\\text{Diverges}', msg: 'arctan levels off at $\\frac{\\pi}{2}$; it never blows up.', tag: 'imp-limit', step: 4 },
      { v: 3 * Math.PI / 4, tex: '\\frac{3\\pi}{4}', msg: 'Top MINUS bottom: $\\frac{\\pi}{2} - \\frac{\\pi}{4}$.', tag: 'sign', step: 3 },
    ];
    s.hints = ['Top limit $\\infty$: use $b$ and $\\lim_{b\\to\\infty}$.', 'Antiderivative: $\\arctan x$.', '$\\arctan b \\to \\frac{\\pi}{2}$ and $\\arctan 1 = \\frac{\\pi}{4}$.'];
    return build(s);
  }
  const a = fx.a ?? r.pick([1, 2, 3, 1]);
  const a2 = a * a;
  const at = (v) => (a === 1 ? `\\arctan ${v}` : `\\frac{1}{${a}}\\arctan\\frac{${v}}{${a}}`);
  const exact = `\\frac{\\pi}{${2 * a}}`, value = Math.PI / (2 * a);
  const s = { family: 'arctan_inf', famLabel: 'arctan out to ∞', level: 2, lo: '0', hi: '\\infty', fTex: `\\frac{1}{x^{2}+${a2}}`, f: (x) => 1 / (x * x + a2), type: 'upper', domain: [0, 5], pic: { x: [-0.4, 8.5], y: [0, 1.25 / a2], from: 0, to: 8.5, tail: 'right' } };
  s.F = { tex: at('x'), f: (x) => Math.atan(x / a) / a, think: `$\\int\\frac{dx}{x^{2}+a^{2}} = \\frac{1}{a}\\arctan\\frac{x}{a}$ with $a = ${a}$.`, domain: [0, 3], tag: 'kfactor', mist: a === 1 ? [] : [{ f: (x) => Math.atan(x / a), msg: `Keep the $\\frac{1}{${a}}$ in front.`, tag: 'kfactor' }] };
  s.value = value; s.exact = exact;
  s.pieces = [{ plug: [`${at('b')} - ${at(0)} = ${at('b')} - 0`], lim: [`\\lim_{b\\to\\infty} ${at('b')} = ${a === 1 ? '' : `\\frac{1}{${a}}\\cdot`}\\frac{\\pi}{2} = ${exact}`], why: 'arctan levels off: $\\arctan(\\text{huge}) \\to \\frac{\\pi}{2}$.' }];
  const toPi = { v: Math.PI / a, tex: a === 1 ? '\\pi' : `\\frac{\\pi}{${a}}`, msg: '$\\arctan b \\to \\frac{\\pi}{2}$, not $\\pi$.', tag: 'imp-limit', step: 4 };
  const dropK = { v: Math.PI / 2, tex: '\\frac{\\pi}{2}', msg: `You dropped the $\\frac{1}{${a}}$ from $\\frac{1}{${a}}\\arctan\\frac{x}{${a}}$.`, tag: 'kfactor', step: 2 };
  s.mistakes = [
    { v: DIV, tex: '\\text{Diverges}', msg: 'arctan levels off at $\\frac{\\pi}{2}$; it never blows up. So it converges.', tag: 'imp-limit', step: 4 },
    ...(a === 1 ? [toPi, { v: Math.PI / 4, tex: '\\frac{\\pi}{4}', msg: '$\\frac{\\pi}{4}$ is $\\arctan 1$. As $b \\to \\infty$, $\\arctan b \\to \\frac{\\pi}{2}$.', tag: 'imp-limit', step: 4 }]
      : a === 2 ? [dropK, { v: Math.PI / 8, tex: '\\frac{\\pi}{8}', msg: 'Divide by $a = 2$, not $a^{2} = 4$: the antiderivative is $\\frac{1}{2}\\arctan\\frac{x}{2}$.', tag: 'kfactor', step: 2 }]
        : [toPi, dropK]),
  ];
  s.hints = ['Top limit $\\infty$: use $b$ and $\\lim_{b\\to\\infty}$.', `Antiderivative: $${at('x')}$.`, '$\\arctan(\\text{huge}) \\to \\frac{\\pi}{2}$.'];
  return build(s);
}

/* ---------------- Type 1, shifted power ---------------- */
function shifted_inf(level, r, fx = {}) {
  const variant = fx.variant ?? r.pickW([['sq', 4], ['cube', 2], ['div', 2]]);
  if (variant === 'div') {
    const c = fx.c ?? r.pick([1, 2]);
    const s = { family: 'shifted_inf', famLabel: '1/(x + c) out to ∞', level: 2, lo: '0', hi: '\\infty', fTex: `\\frac{1}{x + ${c}}`, f: (x) => 1 / (x + c), type: 'upper', domain: [0, 5], pic: { x: [-0.4, 8.5], y: [0, 1.15 / c], from: 0, to: 8.5, tail: 'right' } };
    s.F = { tex: `\\ln(x + ${c})`, f: (x) => Math.log(x + c), think: `$\\int\\frac{dx}{x + ${c}} = \\ln|x + ${c}|$, and $x + ${c} > 0$ here.`, domain: [0, 3], tag: 'usub', mist: [{ f: (x) => -1 / (x + c), msg: 'The power is $-1$, so it is a log, not the power rule.', tag: 'power' }] };
    s.value = DIV;
    s.pieces = [{ plug: [`\\ln(b + ${c}) - \\ln ${c}`], lim: [`\\lim_{b\\to\\infty}\\left(\\ln(b + ${c}) - \\ln ${c}\\right) = \\infty`], why: '$\\ln(b + ' + c + ')$ grows forever.' }];
    s.mistakes = c === 1 ? [
      { v: 0, tex: '0', msg: '$\\ln(b + 1)$ does not go to 0; it grows forever. Diverges.', tag: 'imp-limit', step: 4 },
      { v: 1, tex: '1', msg: 'That is the answer for $\\frac{1}{(x+1)^{2}}$. With power 1 it is a log, and logs never level off.', tag: 'p-test', step: 2 },
      { v: 'conv', msg: 'Far out, $\\frac{1}{x + 1}$ acts like $\\frac{1}{x}$: $p = 1$ diverges.', tag: 'p-test', step: 4 },
    ] : [
      { v: -Math.log(2), tex: '-\\ln 2', msg: '$\\ln(b + 2)$ does not go to 0; it grows forever. Diverges.', tag: 'imp-limit', step: 4 },
      { v: 0.5, tex: '\\frac{1}{2}', msg: 'That is the answer for $\\frac{1}{(x+2)^{2}}$. With power 1 it is a log, and logs never level off.', tag: 'p-test', step: 2 },
      { v: 'conv', msg: 'Far out, $\\frac{1}{x + 2}$ acts like $\\frac{1}{x}$: $p = 1$ diverges.', tag: 'p-test', step: 4 },
    ];
    s.hints = ['Top limit $\\infty$: use $b$.', `Antiderivative: $\\ln(x + ${c})$.`, 'Logs grow forever.'];
    return build(s);
  }
  if (variant === 'cube') {
    const c = fx.c ?? r.pick([1, 2]);
    const value = 1 / (2 * c * c), exact = Qt(1, 2 * c * c);
    const s = { family: 'shifted_inf', famLabel: '1/(x + c)³ out to ∞', level: 2, lo: '0', hi: '\\infty', fTex: `\\frac{1}{(x + ${c})^{3}}`, f: (x) => (x + c) ** -3, type: 'upper', domain: [0, 4], pic: { x: [-0.4, 6.5], y: [0, 1.2 / c ** 3], from: 0, to: 6.5, tail: 'right' } };
    s.F = { tex: `-\\frac{1}{2(x + ${c})^{2}}`, f: (x) => -1 / (2 * (x + c) ** 2), think: `Power rule on $(x + ${c})^{-3}$: $\\frac{(x+${c})^{-2}}{-2} = -\\frac{1}{2(x + ${c})^{2}}$.`, domain: [0, 3], mist: [{ f: (x) => -1 / (x + c) ** 2, msg: 'Divide by the new power, $-2$: keep the $\\frac{1}{2}$.', tag: 'power' }] };
    s.value = value; s.exact = exact;
    s.pieces = [{ plug: [`\\left(-\\frac{1}{2(b + ${c})^{2}}\\right) - \\left(-\\frac{1}{2(0 + ${c})^{2}}\\right) = -\\frac{1}{2(b + ${c})^{2}} + ${exact}`], lim: [`\\lim_{b\\to\\infty}\\left(-\\frac{1}{2(b + ${c})^{2}} + ${exact}\\right) = 0 + ${exact} = ${exact}`], why: 'A fixed number over something huge goes to 0.' }];
    s.mistakes = [
      { v: DIV, tex: '\\text{Diverges}', msg: 'Far out it acts like $\\frac{1}{x^{3}}$: $p = 3 > 1$ converges.', tag: 'p-test', step: 4 },
      { v: -value, tex: '-' + exact, msg: 'Top minus bottom, and minus a negative is a plus.', tag: 'sign', step: 3 },
      { v: 1 / (c * c), tex: Qt(1, c * c), msg: 'Divide by the new power, $-2$: the antiderivative has a $\\frac{1}{2}$.', tag: 'power', step: 2 },
    ];
    s.hints = ['Top limit $\\infty$: use $b$.', `Antiderivative: $-\\frac{1}{2(x + ${c})^{2}}$.`, 'The $b$ part goes to 0.'];
    return build(s);
  }
  const [lo, c] = fx.lc ?? r.pick([[0, 2], [0, 3], [1, 1], [1, 2]]);
  const value = 1 / (lo + c), exact = Qt(1, lo + c);
  const s = { family: 'shifted_inf', famLabel: '1/(x + c)² out to ∞', level: 2, lo: String(lo), hi: '\\infty', fTex: `\\frac{1}{(x + ${c})^{2}}`, f: (x) => (x + c) ** -2, type: 'upper', domain: [lo, lo + 5], pic: { x: [-0.4, 8.5], y: [0, 1.2 / (lo + c) ** 2 * 1.4], from: lo, to: 8.5, tail: 'right' } };
  s.F = { tex: `-\\frac{1}{x + ${c}}`, f: (x) => -1 / (x + c), think: `Power rule on $(x + ${c})^{-2}$: $\\frac{(x + ${c})^{-1}}{-1} = -\\frac{1}{x + ${c}}$.`, domain: [0, 3], mist: [{ f: (x) => 1 / (x + c), msg: 'Sign: dividing by $-1$ brings a minus.', tag: 'sign' }, { f: (x) => Math.log(x + c), msg: 'It is squared, so it is not a log. Power rule.', tag: 'power' }] };
  s.value = value; s.exact = exact;
  s.pieces = [{ plug: [`\\left(-\\frac{1}{b + ${c}}\\right) - \\left(-\\frac{1}{${lo} + ${c}}\\right) = -\\frac{1}{b + ${c}} + ${exact}`], lim: [`\\lim_{b\\to\\infty}\\left(-\\frac{1}{b + ${c}} + ${exact}\\right) = 0 + ${exact} = ${exact}`], why: `As $b \\to \\infty$, $\\frac{1}{b + ${c}} \\to 0$.` }];
  s.mistakes = [
    { v: DIV, tex: '\\text{Diverges}', msg: 'Far out it acts like $\\frac{1}{x^{2}}$: $p = 2 > 1$ converges.', tag: 'p-test', step: 4 },
    { v: -value, tex: '-' + exact, msg: 'Top minus bottom, and minus a negative is a plus.', tag: 'sign', step: 3 },
    { v: value * value, tex: Qt(1, (lo + c) ** 2), msg: `That is $f(${lo})$, the height of the curve. You need the area: integrate first.`, tag: 'direction', step: 2 },
  ];
  s.hints = ['Top limit $\\infty$: use $b$.', `Antiderivative: $-\\frac{1}{x + ${c}}$.`, `$\\frac{1}{b + ${c}} \\to 0$.`];
  return build(s);
}

/* ---------------- both ends infinite ---------------- */
function both_inf(level, r, fx = {}) {
  const variant = fx.variant ?? (level >= 3 ? r.pick(['xover', 'arctan', 'xover']) : r.pick(['arctan', 'arctan', 'gauss', 'x']));
  const base = { family: 'both_inf', level: level >= 3 ? 3 : 2, lo: '-\\infty', hi: '\\infty', type: 'both', where: '0' };
  if (variant === 'arctan') {
    const a = fx.a ?? r.pick([1, 2, 1]);
    const a2 = a * a;
    const at = (v) => (a === 1 ? `\\arctan ${v}` : `\\frac{1}{${a}}\\arctan\\frac{${v}}{${a}}`);
    const half = `\\frac{\\pi}{${2 * a}}`, exact = a === 1 ? '\\pi' : `\\frac{\\pi}{${a}}`;
    const s = { ...base, famLabel: 'both ends infinite', fTex: `\\frac{1}{x^{2}+${a2}}`, f: (x) => 1 / (x * x + a2), domain: [-3, 3], pic: { x: [-7, 7], y: [0, 1.25 / a2], from: -7, to: 7, tail: 'both' } };
    s.F = { tex: at('x'), f: (x) => Math.atan(x / a) / a, think: `$\\int\\frac{dx}{x^{2}+a^{2}} = \\frac{1}{a}\\arctan\\frac{x}{a}$ with $a = ${a}$.`, domain: [-2, 2], tag: 'kfactor', mist: a === 1 ? [] : [{ f: (x) => Math.atan(x / a), msg: `Keep the $\\frac{1}{${a}}$.`, tag: 'kfactor' }] };
    s.value = Math.PI / a; s.exact = exact;
    s.pieces = [
      { plug: [`${at(0)} - ${at('a')} = 0 - ${at('a')}`], lim: [`\\lim_{a\\to-\\infty}\\left(-${at('a')}\\right) = -${a === 1 ? '' : `\\frac{1}{${a}}\\cdot`}\\left(-\\frac{\\pi}{2}\\right) = ${half}`], why: 'As $a \\to -\\infty$, arctan levels off at $-\\frac{\\pi}{2}$.', value: Math.PI / (2 * a), exact: half, mist: [{ v: DIV, msg: 'arctan levels off at $-\\frac{\\pi}{2}$; it never blows up.', tag: 'imp-limit' }, { v: -Math.PI / (2 * a), msg: 'Minus a negative is a plus.', tag: 'sign' }] },
      { plug: [`${at('b')} - ${at(0)} = ${at('b')} - 0`], lim: [`\\lim_{b\\to\\infty} ${at('b')} = ${a === 1 ? '' : `\\frac{1}{${a}}\\cdot`}\\frac{\\pi}{2} = ${half}`], why: 'As $b \\to \\infty$, arctan levels off at $\\frac{\\pi}{2}$.', value: Math.PI / (2 * a), exact: half, mist: [{ v: DIV, msg: 'arctan levels off at $\\frac{\\pi}{2}$.', tag: 'imp-limit' }] },
    ];
    s.mistakes = [
      { v: Math.PI / (2 * a), tex: half, msg: 'That is only one half. Add both halves.', tag: 'imp-split', step: 5 },
      { v: 0, tex: '0', msg: 'The halves do not cancel: the function is positive everywhere, so both halves ADD.', tag: 'imp-split', step: 5 },
      { v: DIV, tex: '\\text{Diverges}', msg: 'Each half converges (arctan levels off), so the whole thing converges.', tag: 'imp-limit', step: 3 },
    ];
    s.hints = ['Both ends are infinite: split at 0, one limit per half.', `Antiderivative: $${at('x')}$.`, 'arctan levels off at $\\pm\\frac{\\pi}{2}$.'];
    return build(s);
  }
  if (variant === 'gauss') {
    const s = { ...base, famLabel: 'both ends infinite', fTex: 'x\\,e^{-x^{2}}', f: (x) => x * Math.exp(-x * x), domain: [-2, 2], pic: { x: [-3.5, 3.5], y: [-0.55, 0.55], from: -3.5, to: 3.5, tail: 'both' } };
    s.F = { tex: '-\\frac{1}{2}e^{-x^{2}}', f: (x) => -0.5 * Math.exp(-x * x), think: 'u-sub: $u = -x^{2}$, $du = -2x\\,dx$, so $\\int x e^{-x^{2}}dx = -\\frac{1}{2}e^{-x^{2}}$.', domain: [-1.5, 1.5], tag: 'usub', mist: [{ f: (x) => 0.5 * Math.exp(-x * x), msg: '$du = -2x\\,dx$ brings a minus.', tag: 'sign' }, { f: (x) => -2 * Math.exp(-x * x), msg: '$du = -2x\\,dx$, so divide by $-2$, not multiply.', tag: 'kfactor' }] };
    s.value = 0; s.exact = '0';
    s.pieces = [
      { plug: ['\\left(-\\frac{1}{2}e^{0}\\right) - \\left(-\\frac{1}{2}e^{-a^{2}}\\right) = -\\frac{1}{2} + \\frac{1}{2}e^{-a^{2}}'], lim: ['\\lim_{a\\to-\\infty}\\left(-\\frac{1}{2} + \\frac{1}{2}e^{-a^{2}}\\right) = -\\frac{1}{2} + 0 = -\\frac{1}{2}'], why: 'As $a \\to -\\infty$, $a^{2}$ is huge, so $e^{-a^{2}} \\to 0$.', value: -0.5, exact: '-\\frac{1}{2}', mist: [{ v: 0.5, msg: 'Top minus bottom: $F(0) - F(a)$.', tag: 'sign' }, { v: DIV, msg: '$e^{-a^{2}} \\to 0$; nothing blows up.', tag: 'imp-limit' }] },
      { plug: ['\\left(-\\frac{1}{2}e^{-b^{2}}\\right) - \\left(-\\frac{1}{2}e^{0}\\right) = -\\frac{1}{2}e^{-b^{2}} + \\frac{1}{2}'], lim: ['\\lim_{b\\to\\infty}\\left(-\\frac{1}{2}e^{-b^{2}} + \\frac{1}{2}\\right) = 0 + \\frac{1}{2} = \\frac{1}{2}'], why: '$e^{-b^{2}} \\to 0$ as $b \\to \\infty$.', value: 0.5, exact: '\\frac{1}{2}', mist: [{ v: -0.5, msg: 'Top minus bottom: $F(b) - F(0)$.', tag: 'sign' }, { v: DIV, msg: '$e^{-b^{2}} \\to 0$; nothing blows up.', tag: 'imp-limit' }] },
    ];
    s.mistakes = [
      { v: DIV, tex: '\\text{Diverges}', msg: 'Both halves converge ($-\\frac{1}{2}$ and $\\frac{1}{2}$), so the whole thing converges, to 0.', tag: 'imp-limit', step: 3 },
      { v: 0.5, tex: '\\frac{1}{2}', msg: 'That is only the right half. The left half is $-\\frac{1}{2}$.', tag: 'imp-split', step: 5 },
      { v: -1, tex: '-1', msg: 'Sign slip in the right half: $F(b) - F(0) = 0 - \\left(-\\frac{1}{2}\\right) = +\\frac{1}{2}$.', tag: 'sign', step: 4 },
    ];
    s.hints = ['Both ends infinite: split at 0.', 'u-sub: antiderivative $-\\frac{1}{2}e^{-x^{2}}$.', 'Each half converges. Then add.'];
    return build(s);
  }
  if (variant === 'x') {
    const s = { ...base, famLabel: 'both ends infinite', fTex: 'x', f: (x) => x, domain: [-2, 2], pic: { x: [-4, 4], y: [-4, 4], from: -4, to: 4, tail: 'both' } };
    s.F = { tex: '\\frac{x^{2}}{2}', f: (x) => x * x / 2, think: 'Power rule: $\\int x\\,dx = \\frac{x^{2}}{2}$.', domain: [-2, 2], mist: [{ f: (x) => x * x, msg: 'Divide by the new power: $\\frac{x^{2}}{2}$.', tag: 'power' }] };
    s.value = DIV;
    s.pieces = [
      { plug: ['\\frac{0^{2}}{2} - \\frac{a^{2}}{2} = -\\frac{a^{2}}{2}'], lim: ['\\lim_{a\\to-\\infty}\\left(-\\frac{a^{2}}{2}\\right) = -\\infty'], why: '$a^{2}$ is huge, so $-\\frac{a^{2}}{2} \\to -\\infty$. This half diverges.', value: DIV, mist: [{ v: 0, msg: '$a^{2}$ does not go to 0 as $a \\to -\\infty$; it blows up.', tag: 'imp-limit' }] },
      { plug: ['\\frac{b^{2}}{2} - \\frac{0^{2}}{2} = \\frac{b^{2}}{2}'], lim: ['\\lim_{b\\to\\infty} \\frac{b^{2}}{2} = \\infty'], why: 'This half diverges too.', value: DIV, mist: [{ v: 0, msg: '$\\frac{b^{2}}{2} \\to \\infty$.', tag: 'imp-limit' }] },
    ];
    s.mistakes = [
      { v: 0, tex: '0', msg: 'That is the symmetric-limit trap: $\\lim_{t\\to\\infty}\\int_{-t}^{t}x\\,dx = 0$, but $\\infty - \\infty$ is not 0. Each half must converge by itself, and neither does.', tag: 'imp-split', step: 1 },
      { v: 'conv', msg: 'Neither half converges, so the integral diverges.', tag: 'imp-split', step: 5 },
    ];
    s.hints = ['Both ends infinite: split at 0, one limit per half.', 'Antiderivative: $\\frac{x^{2}}{2}$.', 'If even one half diverges, the whole thing diverges.'];
    return build(s);
  }
  // x/(x² + 1): the symmetric-limit trap
  const s = { ...base, famLabel: 'both ends infinite', fTex: '\\frac{x}{x^{2}+1}', f: (x) => x / (x * x + 1), domain: [-3, 3], pic: { x: [-7, 7], y: [-0.6, 0.6], from: -7, to: 7, tail: 'both' } };
  s.F = { tex: '\\frac{1}{2}\\ln(x^{2}+1)', f: (x) => 0.5 * Math.log(x * x + 1), think: 'u-sub: $u = x^{2}+1$, $du = 2x\\,dx$, so it is $\\frac{1}{2}\\ln(x^{2}+1)$.', domain: [-2, 2], tag: 'usub', mist: [{ f: (x) => Math.atan(x), msg: 'With $x$ on top it is a log (u-sub), not arctan.', tag: 'usub' }, { f: (x) => Math.log(x * x + 1), msg: '$du = 2x\\,dx$, so a $\\frac{1}{2}$ appears.', tag: 'kfactor' }] };
  s.value = DIV;
  s.pieces = [
    { plug: ['\\frac{1}{2}\\ln(0 + 1) - \\frac{1}{2}\\ln(a^{2}+1) = -\\frac{1}{2}\\ln(a^{2}+1)'], lim: ['\\lim_{a\\to-\\infty}\\left(-\\frac{1}{2}\\ln(a^{2}+1)\\right) = -\\infty'], why: '$a^{2}+1$ is huge, and the log of something huge is huge. This half diverges.', value: DIV, mist: [{ v: 0, msg: '$\\ln(a^{2}+1)$ grows without bound.', tag: 'imp-limit' }] },
    { plug: ['\\frac{1}{2}\\ln(b^{2}+1) - \\frac{1}{2}\\ln 1 = \\frac{1}{2}\\ln(b^{2}+1)'], lim: ['\\lim_{b\\to\\infty}\\frac{1}{2}\\ln(b^{2}+1) = \\infty'], why: 'This half diverges too.', value: DIV, mist: [{ v: 0, msg: '$\\ln(b^{2}+1) \\to \\infty$.', tag: 'imp-limit' }] },
  ];
  s.mistakes = [
    { v: 0, tex: '0', msg: 'That is the symmetric-limit trap. $\\infty - \\infty$ is not 0: each half has to converge by itself, and $\\frac{1}{2}\\ln(b^{2}+1) \\to \\infty$.', tag: 'imp-split', step: 1 },
    { v: Math.PI, tex: '\\pi', msg: 'Only $\\frac{1}{x^{2}+1}$ gives arctan. With $x$ on top, it is a log.', tag: 'usub', step: 2 },
    { v: 'conv', msg: 'Neither half converges, so the integral diverges.', tag: 'imp-split', step: 5 },
  ];
  s.hints = ['Both ends infinite: split at 0.', 'u-sub: antiderivative $\\frac{1}{2}\\ln(x^{2}+1)$.', 'Check each half on its own. One bad half sinks the whole thing.'];
  return build(s);
}

/* ---------------- Type 2 inside the interval: split there ---------------- */
function interior(level, r, fx = {}) {
  const variant = fx.variant ?? r.pickW([['sq', 5], ['cbrt', 3], ['cube', 1]]);
  if (variant === 'sq') {
    const c = fx.c ?? r.pick([0, 0, 1, 2]);
    const [m, n] = fx.mn ?? r.pick([[1, 2], [2, 1], [1, 3], [1, 1]]);
    const lo = c - m, hi = c + n;
    const blind = -1 / n - 1 / m, blindT = blind === -2 ? '-2' : Qt(-(m + n), m * n);
    const den = c === 0 ? 'x' : `x - ${c}`;
    const fTex = c === 0 ? '\\frac{1}{x^{2}}' : `\\frac{1}{(x - ${c})^{2}}`;
    const at = (v) => (c === 0 ? `-\\frac{1}{${v}}` : `-\\frac{1}{${v} - ${c}}`);
    const s = { family: 'interior', famLabel: 'asymptote inside', level: 3, lo: String(lo), hi: String(hi), fTex, f: (x) => (x - c) ** -2, type: 'interior', where: String(c), domain: [c + 0.35, hi], pic: { x: [lo - 0.4, hi + 0.4], y: [0, 6], from: lo, to: hi, asym: [c] } };
    s.spot = `x = ${c} \\text{ makes } ${c === 0 ? 'x^{2}' : `(x - ${c})^{2}`} = 0\\text{, and } ${c} \\text{ is inside } [${lo}, ${hi}] \\;\\Rightarrow\\; \\text{split at } ${c}`;
    s.F = { tex: c === 0 ? '-\\frac{1}{x}' : `-\\frac{1}{x - ${c}}`, f: (x) => -1 / (x - c), think: `Power rule on $(${den})^{-2}$: $-\\frac{1}{${den}}$.`, domain: [c + 0.4, c + 3], mist: [{ f: (x) => 1 / (x - c), msg: 'Sign: dividing by $-1$ brings a minus.', tag: 'sign' }] };
    s.value = DIV;
    const mFrac = m === 1 ? '1' : `\\frac{1}{${m}}`, nFrac = n === 1 ? '1' : `\\frac{1}{${n}}`;
    s.pieces = [
      { plug: [`\\left(${at('t')}\\right) - \\left(${at(lo)}\\right) = ${at('t')} - ${mFrac}`], lim: [`\\lim_{t\\to ${c}^{-}}\\left(${at('t')} - ${mFrac}\\right) = \\infty`], why: `As $t \\to ${c}^{-}$, $${c === 0 ? 't' : `t - ${c}`}$ is a tiny NEGATIVE number, so $${at('t')}$ is huge and positive.`, value: DIV, mist: [{ v: -1 / m, msg: `You cannot plug in $x = ${c}$: the left piece blows up there.`, tag: 'imp-limit' }] },
      { plug: [`\\left(${at(hi)}\\right) - \\left(${at('s')}\\right) = -${nFrac} + ${c === 0 ? '\\frac{1}{s}' : `\\frac{1}{s - ${c}}`}`], lim: [`\\lim_{s\\to ${c}^{+}}\\left(-${nFrac} + ${c === 0 ? '\\frac{1}{s}' : `\\frac{1}{s - ${c}}`}\\right) = \\infty`], why: `As $s \\to ${c}^{+}$, $${c === 0 ? '\\frac{1}{s}' : `\\frac{1}{s - ${c}}`}$ is huge. This piece diverges too.`, value: DIV, mist: [{ v: -1 / n, msg: 'This piece blows up at the asymptote too.', tag: 'imp-limit' }] },
    ];
    s.mistakes = [
      { v: blind, tex: blindT, msg: `That is blind integration straight across $x = ${c}$. A positive function cannot have a negative area: that is the red flag. Split at ${c}.`, tag: 'imp-split', step: 1 },
      { v: -blind, tex: blindT.replace(/^-/, ''), msg: `Splitting at ${c} is right, but you cannot plug ${c} into the antiderivative. Each piece blows up.`, tag: 'imp-limit', step: 3 },
      { v: 'conv', msg: 'Near the asymptote it acts like $\\frac{1}{u^{2}}$: $p = 2 \\ge 1$ diverges.', tag: 'p-test', step: 3 },
    ];
    s.hints = [`$x = ${c}$ is inside the interval and blows the function up. Split there.`, `Antiderivative: $${s.F.tex}$.`, 'If either piece diverges, the whole integral diverges.'];
    return build(s);
  }
  if (variant === 'cube') { // ∫_{−8}^{1} x^{−1/3} dx = −9/2
    const s = { family: 'interior', famLabel: 'asymptote inside', level: 3, lo: '-8', hi: '1', fTex: '\\frac{1}{\\sqrt[3]{x}}', f: (x) => 1 / Math.cbrt(x), type: 'interior', where: '0', domain: [0.3, 1], pic: { x: [-8.5, 1.6], y: [-3, 3], from: -8, to: 1, asym: [0] } };
    s.spot = 'x = 0 \\text{ makes } \\sqrt[3]{x} = 0\\text{, and } 0 \\text{ is inside } [-8, 1] \\;\\Rightarrow\\; \\text{split at } 0';
    s.F = { tex: '\\frac{3}{2}x^{2/3}', f: (x) => 1.5 * Math.cbrt(x * x), think: 'Rewrite as $x^{-1/3}$. Power rule: $\\frac{x^{2/3}}{2/3} = \\frac{3}{2}x^{2/3}$.', domain: [0.3, 2], mist: [{ f: (x) => (2 / 3) * Math.cbrt(x * x), msg: 'Divide by $\\frac{2}{3}$, which means multiply by $\\frac{3}{2}$.', tag: 'power' }] };
    s.value = -4.5; s.exact = '-\\frac{9}{2}';
    s.pieces = [
      { plug: ['\\frac{3}{2}t^{2/3} - \\frac{3}{2}(-8)^{2/3} = \\frac{3}{2}t^{2/3} - \\frac{3}{2}(4) = \\frac{3}{2}t^{2/3} - 6'], lim: ['\\lim_{t\\to 0^{-}}\\left(\\frac{3}{2}t^{2/3} - 6\\right) = 0 - 6 = -6'], why: '$(-8)^{2/3} = \\left(\\sqrt[3]{-8}\\right)^{2} = (-2)^{2} = 4$. And $t^{2/3} \\to 0$.', value: -6, exact: '-6', mist: [{ v: 6, msg: '$(-8)^{2/3} = (-2)^{2} = +4$, so $F(-8) = 6$ and you subtract it.', tag: 'algebra' }, { v: DIV, msg: '$p = \\frac{1}{3} < 1$: this piece converges.', tag: 'p-test' }] },
      { plug: ['\\frac{3}{2}(1)^{2/3} - \\frac{3}{2}s^{2/3} = \\frac{3}{2} - \\frac{3}{2}s^{2/3}'], lim: ['\\lim_{s\\to 0^{+}}\\left(\\frac{3}{2} - \\frac{3}{2}s^{2/3}\\right) = \\frac{3}{2}'], why: '$s^{2/3} \\to 0$ as $s \\to 0^{+}$.', value: 1.5, exact: '\\frac{3}{2}', mist: [{ v: DIV, msg: '$p = \\frac{1}{3} < 1$: this piece converges.', tag: 'p-test' }] },
    ];
    s.mistakes = [
      { v: DIV, tex: '\\text{Diverges}', msg: 'Both pieces blow up like $x^{-1/3}$: $p = \\frac{1}{3} < 1$, so both converge.', tag: 'p-test', step: 3 },
      { v: 1.5, tex: '\\frac{3}{2}', msg: 'That is only the right piece. Add the left piece, $-6$.', tag: 'imp-split', step: 5 },
      { v: 7.5, tex: '\\frac{15}{2}', msg: '$(-8)^{2/3} = (-2)^{2} = 4$, so the left piece is $0 - 6 = -6$.', tag: 'algebra', step: 3 },
    ];
    s.hints = ['$x = 0$ is inside $[-8, 1]$: split there.', 'Antiderivative: $\\frac{3}{2}x^{2/3}$.', '$(-8)^{2/3} = 4$. Add the two pieces.'];
    return build(s);
  }
  // 1/(x − c)^{2/3}: both pieces converge
  const c = fx.c ?? r.pick([0, 1]);
  const [m, n] = fx.mn ?? r.pick([[1, 1], [1, 8], [8, 1]]);
  const lo = c - m, hi = c + n, cm = Math.cbrt(m), cn = Math.cbrt(n);
  const value = 3 * (cm + cn);
  const fTex = c === 0 ? '\\frac{1}{x^{2/3}}' : `\\frac{1}{(x - ${c})^{2/3}}`;
  const in_ = (v) => (c === 0 ? `${v}` : `${v} - ${c}`);
  const s = { family: 'interior', famLabel: 'asymptote inside', level: 3, lo: String(lo), hi: String(hi), fTex, f: (x) => 1 / Math.cbrt((x - c) ** 2), type: 'interior', where: String(c), domain: [c + 0.3, hi], pic: { x: [lo - 0.4, hi + 0.4], y: [0, 5], from: lo, to: hi, asym: [c] } };
  s.spot = `x = ${c} \\text{ blows it up, and } ${c} \\text{ is inside } [${lo}, ${hi}] \\;\\Rightarrow\\; \\text{split at } ${c}`;
  s.F = { tex: `3\\sqrt[3]{${in_('x')}}`, f: (x) => 3 * Math.cbrt(x - c), think: `Rewrite as $(${in_('x')})^{-2/3}$. Power rule: $\\frac{(${in_('x')})^{1/3}}{1/3} = 3\\sqrt[3]{${in_('x')}}$.`, domain: [c + 0.3, c + 3], mist: [{ f: (x) => Math.cbrt(x - c) / 3, msg: 'Divide by the new power $\\frac{1}{3}$, which means multiply by 3.', tag: 'power' }] };
  s.value = value; s.exact = String(value);
  s.pieces = [
    { plug: [`3\\sqrt[3]{${in_('t')}} - 3\\sqrt[3]{-${m}}`], lim: [`\\lim_{t\\to ${c}^{-}}\\left(3\\sqrt[3]{${in_('t')}} - 3\\sqrt[3]{-${m}}\\right) = 0 - 3(-${cm}) = ${3 * cm}`], why: `Cube roots of negatives are negative: $\\sqrt[3]{-${m}} = -${cm}$. And $\\sqrt[3]{${in_('t')}} \\to 0$.`, value: 3 * cm, exact: String(3 * cm), mist: [{ v: -3 * cm, msg: `$\\sqrt[3]{-${m}} = -${cm}$, and minus a negative is a plus.`, tag: 'sign' }, { v: DIV, msg: '$p = \\frac{2}{3} < 1$: this piece converges.', tag: 'p-test' }] },
    { plug: [`3\\sqrt[3]{${n}} - 3\\sqrt[3]{${in_('s')}}`], lim: [`\\lim_{s\\to ${c}^{+}}\\left(${3 * cn} - 3\\sqrt[3]{${in_('s')}}\\right) = ${3 * cn}`], why: `$\\sqrt[3]{${n}} = ${cn}$, and $\\sqrt[3]{${in_('s')}} \\to 0$.`, value: 3 * cn, exact: String(3 * cn), mist: [{ v: DIV, msg: '$p = \\frac{2}{3} < 1$: this piece converges.', tag: 'p-test' }] },
  ];
  s.mistakes = [
    { v: DIV, tex: '\\text{Diverges}', msg: 'Near the asymptote it acts like $u^{-2/3}$: $p = \\frac{2}{3} < 1$, so each piece converges.', tag: 'p-test', step: 3 },
    { v: 3 * cn, tex: String(3 * cn), msg: `That is only the right piece. Add the left piece, ${3 * cm}.`, tag: 'imp-split', step: 5 },
    { v: 3 * cn - 3 * cm, tex: String(3 * cn - 3 * cm), msg: `$\\sqrt[3]{-${m}} = -${cm}$, so the left piece is $0 - 3(-${cm}) = +${3 * cm}$.`, tag: 'sign', step: 3 },
  ];
  s.hints = [`$x = ${c}$ is inside the interval: split there.`, `Antiderivative: $3\\sqrt[3]{${in_('x')}}$.`, 'Both pieces converge here. Add them.'];
  return build(s);
}

/* ---------------- logs out to ∞ ---------------- */
function ln_inf(level, r, fx = {}) {
  const variant = fx.variant ?? (level >= 3 ? r.pick(['lnln', 'lnx']) : 'sq');
  if (variant === 'sq') {
    const s = { family: 'ln_inf', famLabel: 'logs out to ∞', level: 2, lo: 'e', hi: '\\infty', fTex: '\\frac{1}{x(\\ln x)^{2}}', f: (x) => 1 / (x * Math.log(x) ** 2), type: 'upper', domain: [3, 10], pic: { x: [2.2, 14], y: [0, 0.7], from: Math.E, to: 14, tail: 'right' } };
    s.F = { tex: '-\\frac{1}{\\ln x}', f: (x) => -1 / Math.log(x), think: 'u-sub: $u = \\ln x$, $du = \\frac{dx}{x}$. Then $\\int u^{-2}du = -\\frac{1}{u} = -\\frac{1}{\\ln x}$.', domain: [3, 8], tag: 'usub', mist: [{ f: (x) => 1 / Math.log(x), msg: 'Sign: $\\int u^{-2}du = -u^{-1}$.', tag: 'sign' }, { f: (x) => -1 / x, msg: 'Back-substitute $u = \\ln x$, not $x$.', tag: 'usub' }] };
    s.value = 1; s.exact = '1';
    s.pieces = [{ plug: ['\\left(-\\frac{1}{\\ln b}\\right) - \\left(-\\frac{1}{\\ln e}\\right) = -\\frac{1}{\\ln b} + 1'], lim: ['\\lim_{b\\to\\infty}\\left(-\\frac{1}{\\ln b} + 1\\right) = 0 + 1 = 1'], why: '$\\ln b \\to \\infty$, so $\\frac{1}{\\ln b} \\to 0$. (And $\\ln e = 1$.)' }];
    s.mistakes = [
      { v: DIV, tex: '\\text{Diverges}', msg: '$\\ln b$ grows, so $\\frac{1}{\\ln b}$ SHRINKS to 0. It converges.', tag: 'imp-limit', step: 4 },
      { v: -1, tex: '-1', msg: 'Top minus bottom, and minus a negative is a plus.', tag: 'sign', step: 3 },
      { v: 1 / Math.E, tex: '\\frac{1}{e}', msg: 'You plugged $x$ in where $\\ln x$ goes. With $u = \\ln x$ the antiderivative is $-\\frac{1}{\\ln x}$.', tag: 'usub', step: 2 },
    ];
    s.hints = ['Top limit $\\infty$: use $b$.', 'u-sub $u = \\ln x$: antiderivative $-\\frac{1}{\\ln x}$.', '$\\ln e = 1$, and $\\frac{1}{\\ln b} \\to 0$.'];
    return build(s);
  }
  if (variant === 'lnln') {
    const s = { family: 'ln_inf', famLabel: 'logs out to ∞', level: 3, lo: '2', hi: '\\infty', fTex: '\\frac{1}{x\\ln x}', f: (x) => 1 / (x * Math.log(x)), type: 'upper', domain: [2, 9], pic: { x: [1.4, 14], y: [0, 0.9], from: 2, to: 14, tail: 'right' } };
    s.F = { tex: '\\ln(\\ln x)', f: (x) => Math.log(Math.log(x)), think: 'u-sub: $u = \\ln x$, $du = \\frac{dx}{x}$. Then $\\int\\frac{du}{u} = \\ln|u| = \\ln(\\ln x)$.', domain: [3, 8], tag: 'usub', mist: [{ f: (x) => -1 / Math.log(x), msg: 'The power on $u$ is $-1$, so it is a log, not the power rule.', tag: 'power' }] };
    s.value = DIV;
    s.pieces = [{ plug: ['\\ln(\\ln b) - \\ln(\\ln 2)'], lim: ['\\lim_{b\\to\\infty}\\left(\\ln(\\ln b) - \\ln(\\ln 2)\\right) = \\infty'], why: '$\\ln b \\to \\infty$, and the log of something huge is still huge. $\\ln(\\ln b) \\to \\infty$, just very slowly.' }];
    s.mistakes = [
      { v: -Math.log(Math.log(2)), tex: '-\\ln(\\ln 2)', msg: '$\\ln(\\ln b)$ does not go to 0. It grows forever, just very slowly.', tag: 'imp-limit', step: 4 },
      { v: 1 / Math.log(2), tex: '\\frac{1}{\\ln 2}', msg: 'That treats it like $\\frac{1}{x(\\ln x)^{2}}$. Here the power on $\\ln x$ is 1, so it is a log of a log, which never levels off.', tag: 'p-test', step: 2 },
      { v: 'conv', msg: '$\\ln(\\ln b)$ creeps up forever. Diverges.', tag: 'imp-limit', step: 4 },
    ];
    s.hints = ['Top limit $\\infty$: use $b$.', 'u-sub $u = \\ln x$: antiderivative $\\ln(\\ln x)$.', 'Logs never level off.'];
    return build(s);
  }
  const s = { family: 'ln_inf', famLabel: 'logs out to ∞', level: 3, lo: '1', hi: '\\infty', fTex: '\\frac{\\ln x}{x}', f: (x) => Math.log(x) / x, type: 'upper', domain: [1, 8], pic: { x: [0.6, 14], y: [0, 0.45], from: 1, to: 14, tail: 'right' } };
  s.F = { tex: '\\frac{(\\ln x)^{2}}{2}', f: (x) => Math.log(x) ** 2 / 2, think: 'u-sub: $u = \\ln x$, $du = \\frac{dx}{x}$. Then $\\int u\\,du = \\frac{u^{2}}{2} = \\frac{(\\ln x)^{2}}{2}$.', domain: [1, 6], tag: 'usub', mist: [{ f: (x) => Math.log(x) ** 2, msg: 'Divide by the new power: $\\frac{u^{2}}{2}$.', tag: 'power' }] };
  s.value = DIV;
  s.pieces = [{ plug: ['\\frac{(\\ln b)^{2}}{2} - \\frac{(\\ln 1)^{2}}{2} = \\frac{(\\ln b)^{2}}{2} - 0'], lim: ['\\lim_{b\\to\\infty}\\frac{(\\ln b)^{2}}{2} = \\infty'], why: '$\\ln b \\to \\infty$, so its square does too.' }];
  s.mistakes = [
    { v: 0, tex: '0', msg: 'You only used the bottom: $\\ln 1 = 0$. The top grows: $\\frac{(\\ln b)^{2}}{2} \\to \\infty$.', tag: 'imp-limit', step: 4 },
    { v: 0.5, tex: '\\frac{1}{2}', msg: '$(\\ln b)^{2}$ keeps growing; nothing makes it level off.', tag: 'imp-limit', step: 4 },
    { v: 'conv', msg: 'It grows like $(\\ln b)^{2}$, forever. Diverges.', tag: 'imp-limit', step: 4 },
  ];
  s.hints = ['Top limit $\\infty$: use $b$.', 'u-sub $u = \\ln x$: antiderivative $\\frac{(\\ln x)^{2}}{2}$.', 'What does $(\\ln b)^{2}$ do as $b \\to \\infty$?'];
  return build(s);
}

/* ---------------- parts + a limit (L'Hôpital) ---------------- */
function ibp_inf(level, r, fx = {}) {
  const variant = fx.variant ?? r.pick(['xexp', 'xexp', 'lnx2', 'lnx']);
  if (variant === 'xexp') {
    const k = fx.k ?? r.pick([1, 2]);
    const exact = k === 1 ? '1' : '\\frac{1}{4}', value = 1 / (k * k);
    const FT = k === 1 ? '-xe^{-x} - e^{-x}' : '-\\frac{x}{2}e^{-2x} - \\frac{1}{4}e^{-2x}';
    const s = { family: 'ibp_inf', famLabel: 'parts + a limit', level: 3, lo: '0', hi: '\\infty', fTex: k === 1 ? 'x\\,e^{-x}' : 'x\\,e^{-2x}', f: (x) => x * Math.exp(-k * x), type: 'upper', domain: [0, 5], pic: { x: [-0.4, 8], y: [0, 0.5 / k], from: 0, to: 8, tail: 'right' } };
    s.F = { tex: FT, f: (x) => -(x / k) * Math.exp(-k * x) - Math.exp(-k * x) / (k * k), think: `Parts: $u = x$, $dv = e^{-${k === 1 ? '' : k}x}dx$, so $du = dx$, $v = ${k === 1 ? '-e^{-x}' : '-\\frac{1}{2}e^{-2x}'}$. Then $uv - \\int v\\,du$ gives $${FT}$.`, domain: [0, 2], tag: 'formula-sign', mist: [{ f: (x) => -(x / k) * Math.exp(-k * x) + Math.exp(-k * x) / (k * k), msg: 'The formula subtracts: $uv - \\int v\\,du$.', tag: 'formula-sign' }] };
    s.value = value; s.exact = exact;
    s.pieces = [{
      plug: [k === 1 ? '\\left(-be^{-b} - e^{-b}\\right) - \\left(-0\\cdot e^{0} - e^{0}\\right) = -\\frac{b}{e^{b}} - \\frac{1}{e^{b}} + 1' : '\\left(-\\frac{b}{2}e^{-2b} - \\frac{1}{4}e^{-2b}\\right) - \\left(0 - \\frac{1}{4}e^{0}\\right) = -\\frac{b}{2e^{2b}} - \\frac{1}{4e^{2b}} + \\frac{1}{4}'],
      lim: [k === 1 ? '\\lim_{b\\to\\infty}\\frac{b}{e^{b}} \\overset{\\text{LH}}{=} \\lim_{b\\to\\infty}\\frac{1}{e^{b}} = 0' : '\\lim_{b\\to\\infty}\\frac{b}{2e^{2b}} \\overset{\\text{LH}}{=} \\lim_{b\\to\\infty}\\frac{1}{4e^{2b}} = 0', k === 1 ? '\\Rightarrow\\; 0 - 0 + 1 = 1' : '\\Rightarrow\\; 0 - 0 + \\frac{1}{4} = \\frac{1}{4}'],
      why: "$\\frac{b}{e^{b}}$ is $\\frac{\\infty}{\\infty}$, so use L'Hôpital (LH): differentiate top and bottom. $e^{b}$ wins, so it goes to 0.",
    }];
    s.mistakes = [
      { v: DIV, tex: '\\text{Diverges}', msg: "$e^{b}$ grows much faster than $b$, so $\\frac{b}{e^{b}} \\to 0$ (L'Hôpital). It converges.", tag: 'imp-limit', step: 4 },
      { v: -value, tex: '-' + exact, msg: 'Top minus bottom, and minus a negative is a plus.', tag: 'sign', step: 3 },
      k === 1 ? { v: 0, tex: '0', msg: 'At $x = 0$: $-0\\cdot e^{0} - e^{0} = -1$, not 0. Subtracting it adds 1.', tag: 'algebra', step: 3 } : { v: 0.5, tex: '\\frac{1}{2}', msg: 'The leftover integral divides by 2 again: $\\frac{1}{4}$, not $\\frac{1}{2}$.', tag: 'kfactor', step: 2 },
    ];
    s.hints = ['Top limit $\\infty$: use $b$.', `Parts with $u = x$: antiderivative $${FT}$.`, "$\\frac{b}{e^{b}} \\to 0$ by L'Hôpital."];
    return build(s);
  }
  if (variant === 'lnx2') {
    const s = { family: 'ibp_inf', famLabel: 'parts + a limit', level: 3, lo: '1', hi: '\\infty', fTex: '\\frac{\\ln x}{x^{2}}', f: (x) => Math.log(x) / (x * x), type: 'upper', domain: [1, 6], pic: { x: [0.7, 12], y: [0, 0.22], from: 1, to: 12, tail: 'right' } };
    s.F = { tex: '-\\frac{\\ln x}{x} - \\frac{1}{x}', f: (x) => -Math.log(x) / x - 1 / x, think: 'Parts: $u = \\ln x$, $dv = x^{-2}dx$, so $du = \\frac{dx}{x}$, $v = -\\frac{1}{x}$. Then $-\\frac{\\ln x}{x} - \\int\\left(-\\frac{1}{x}\\right)\\frac{dx}{x} = -\\frac{\\ln x}{x} - \\frac{1}{x}$.', domain: [1, 4], tag: 'liate', mist: [{ f: (x) => -Math.log(x) / x + 1 / x, msg: 'Sign: $-\\int\\left(-\\frac{1}{x^{2}}\\right)dx = \\int\\frac{dx}{x^{2}} = -\\frac{1}{x}$.', tag: 'formula-sign' }] };
    s.value = 1; s.exact = '1';
    s.pieces = [{
      plug: ['\\left(-\\frac{\\ln b}{b} - \\frac{1}{b}\\right) - \\left(-\\frac{\\ln 1}{1} - \\frac{1}{1}\\right) = -\\frac{\\ln b}{b} - \\frac{1}{b} + 1'],
      lim: ['\\lim_{b\\to\\infty}\\frac{\\ln b}{b} \\overset{\\text{LH}}{=} \\lim_{b\\to\\infty}\\frac{1/b}{1} = 0', '\\Rightarrow\\; 0 - 0 + 1 = 1'],
      why: "$\\frac{\\ln b}{b}$ is $\\frac{\\infty}{\\infty}$: L'Hôpital gives $\\frac{1/b}{1} \\to 0$. Logs lose to powers.",
    }];
    s.mistakes = [
      { v: DIV, tex: '\\text{Diverges}', msg: "$\\ln b$ grows slower than $b$: $\\frac{\\ln b}{b} \\to 0$ (L'Hôpital). It converges.", tag: 'imp-limit', step: 4 },
      { v: -1, tex: '-1', msg: 'Top minus bottom, and minus a negative is a plus.', tag: 'sign', step: 3 },
      { v: 0, tex: '0', msg: 'At $x = 1$: $-\\frac{\\ln 1}{1} - \\frac{1}{1} = -1$, so subtracting it ADDS 1.', tag: 'algebra', step: 3 },
    ];
    s.hints = ['Top limit $\\infty$: use $b$.', 'Parts with $u = \\ln x$ (LIATE).', "$\\frac{\\ln b}{b} \\to 0$ by L'Hôpital."];
    return build(s);
  }
  // ∫_0^1 ln x dx = −1 (Type 2 at the left end)
  const s = { family: 'ibp_inf', famLabel: 'parts + a limit', level: 3, lo: '0', hi: '1', fTex: '\\ln x', f: (x) => Math.log(x), type: 'left', where: '0', domain: [0.2, 1], pic: { x: [-0.1, 1.5], y: [-3.5, 0.6], from: 0, to: 1, asym: [0] } };
  s.spot = '\\ln x \\to -\\infty \\text{ as } x \\to 0^{+} \\;\\Rightarrow\\; \\text{trouble at the left end}';
  s.F = { tex: 'x\\ln x - x', f: (x) => x * Math.log(x) - x, think: 'Parts with $u = \\ln x$, $dv = dx$: $x\\ln x - \\int x\\cdot\\frac{1}{x}dx = x\\ln x - x$.', domain: [0.3, 2], tag: 'liate', mist: [{ f: (x) => x * Math.log(x) + x, msg: 'The formula subtracts: $uv - \\int v\\,du$.', tag: 'formula-sign' }, { f: (x) => 1 / x, msg: 'That is the derivative of $\\ln x$. You need the antiderivative: parts with $dv = dx$.', tag: 'direction' }] };
  s.value = -1; s.exact = '-1';
  s.pieces = [{
    plug: ['\\left(1\\cdot\\ln 1 - 1\\right) - \\left(t\\ln t - t\\right) = -1 - t\\ln t + t'],
    lim: ['\\lim_{t\\to 0^{+}} t\\ln t = \\lim_{t\\to 0^{+}}\\frac{\\ln t}{1/t} \\overset{\\text{LH}}{=} \\lim_{t\\to 0^{+}}\\frac{1/t}{-1/t^{2}} = \\lim_{t\\to 0^{+}}(-t) = 0', '\\Rightarrow\\; -1 - 0 + 0 = -1'],
    why: "$t\\ln t$ is $0\\cdot(-\\infty)$. Rewrite it as $\\frac{\\ln t}{1/t}$ (that is $\\frac{-\\infty}{\\infty}$) and use L'Hôpital: it goes to 0.",
  }];
  s.mistakes = [
    { v: DIV, tex: '\\text{Diverges}', msg: "$t\\ln t \\to 0$ (rewrite as $\\frac{\\ln t}{1/t}$, then L'Hôpital). So it converges.", tag: 'imp-limit', step: 4 },
    { v: 1, tex: '1', msg: 'Top minus bottom: $(-1) - 0 = -1$. The area is below the axis, so it is negative.', tag: 'sign', step: 3 },
    { v: 0, tex: '0', msg: 'At $x = 1$: $1\\cdot\\ln 1 - 1 = -1$, not 0.', tag: 'algebra', step: 3 },
  ];
  s.hints = ['$\\ln x$ blows up (down) at $x = 0$: use $t \\to 0^{+}$.', 'Parts with $u = \\ln x$, $dv = dx$: $x\\ln x - x$.', "$t\\ln t \\to 0$ by L'Hôpital."];
  return build(s);
}

/* ---------------- partial fractions + a limit ---------------- */
function pf_inf(level, r, fx = {}) {
  const variant = fx.variant ?? r.pick(['x1', 'x1b', 'sq', 'shift']);
  if (variant === 'sq') {
    const s = { family: 'pf_inf', famLabel: 'partial fractions + a limit', level: 3, lo: '2', hi: '\\infty', fTex: '\\frac{1}{x^{2}-1}', f: (x) => 1 / (x * x - 1), type: 'upper', domain: [2, 8], pic: { x: [1.5, 12], y: [0, 0.5], from: 2, to: 12, tail: 'right' } };
    s.F = { tex: '\\frac{1}{2}\\ln\\left|\\frac{x-1}{x+1}\\right|', f: (x) => 0.5 * Math.log(Math.abs((x - 1) / (x + 1))), think: 'Partial fractions: $\\frac{1}{x^{2}-1} = \\frac{1/2}{x-1} - \\frac{1/2}{x+1}$. Integrate and combine: $\\frac{1}{2}\\ln\\left|\\frac{x-1}{x+1}\\right|$.', domain: [2, 6], tag: 'constants', mist: [{ f: (x) => Math.log(Math.abs((x - 1) / (x + 1))), msg: 'The partial-fraction constants are $\\pm\\frac{1}{2}$: keep the $\\frac{1}{2}$.', tag: 'constants' }] };
    s.value = 0.5 * Math.log(3); s.exact = '\\frac{1}{2}\\ln 3';
    s.pieces = [{ plug: ['\\frac{1}{2}\\ln\\frac{b-1}{b+1} - \\frac{1}{2}\\ln\\frac{2-1}{2+1} = \\frac{1}{2}\\ln\\frac{b-1}{b+1} - \\frac{1}{2}\\ln\\frac{1}{3}'], lim: ['\\frac{b-1}{b+1} \\to 1 \\;\\Rightarrow\\; \\frac{1}{2}\\ln 1 - \\frac{1}{2}\\ln\\frac{1}{3} = 0 + \\frac{1}{2}\\ln 3 = \\frac{1}{2}\\ln 3'], why: 'Combine the logs FIRST. $\\frac{b-1}{b+1} \\to 1$, and $\\ln 1 = 0$. Also $-\\ln\\frac{1}{3} = \\ln 3$.' }];
    s.mistakes = [
      { v: DIV, tex: '\\text{Diverges}', msg: '$\\ln(b-1) - \\ln(b+1)$ looks like $\\infty - \\infty$. Combine into $\\ln\\frac{b-1}{b+1}$ first: it goes to $\\ln 1 = 0$.', tag: 'imp-limit', step: 4 },
      { v: Math.log(3), tex: '\\ln 3', msg: 'The partial-fraction constants are $\\pm\\frac{1}{2}$, so there is a $\\frac{1}{2}$ in front.', tag: 'constants', step: 2 },
      { v: -0.5 * Math.log(3), tex: '-\\frac{1}{2}\\ln 3', msg: 'Top minus bottom: $0 - \\frac{1}{2}\\ln\\frac{1}{3} = +\\frac{1}{2}\\ln 3$.', tag: 'sign', step: 3 },
    ];
    s.hints = ['Top limit $\\infty$: use $b$.', 'Partial fractions: $\\frac{1/2}{x-1} - \\frac{1/2}{x+1}$.', 'Combine the logs, then $\\frac{b-1}{b+1} \\to 1$.'];
    return build(s);
  }
  const shift = variant === 'shift';
  const lo = shift ? 0 : variant === 'x1b' ? 2 : 1;
  const exact = lo === 2 ? '\\ln\\frac{3}{2}' : '\\ln 2', value = lo === 2 ? Math.log(1.5) : Math.log(2);
  const fTex = shift ? '\\frac{1}{(x+1)(x+2)}' : '\\frac{1}{x(x+1)}';
  const A = shift ? 'x+1' : 'x', B = shift ? 'x+2' : 'x+1';
  const s = { family: 'pf_inf', famLabel: 'partial fractions + a limit', level: 3, lo: String(lo), hi: '\\infty', fTex, f: shift ? (x) => 1 / ((x + 1) * (x + 2)) : (x) => 1 / (x * (x + 1)), type: 'upper', domain: [lo + (shift ? 0 : 0), lo + 6], pic: { x: [lo - 0.3, 12], y: [0, shift ? 0.6 : lo === 1 ? 0.6 : 0.2], from: lo, to: 12, tail: 'right' } };
  s.F = { tex: `\\ln\\left|\\frac{${A}}{${B}}\\right|`, f: (x) => Math.log(Math.abs(shift ? (x + 1) / (x + 2) : x / (x + 1))), think: `Partial fractions: $${fTex} = \\frac{1}{${A}} - \\frac{1}{${B}}$. Integrate and combine the logs: $\\ln|${A}| - \\ln|${B}| = \\ln\\left|\\frac{${A}}{${B}}\\right|$.`, domain: [1, 5], tag: 'constants', mist: [{ f: (x) => Math.log(Math.abs(shift ? (x + 2) / (x + 1) : (x + 1) / x)), msg: 'Sign: it is $\\frac{1}{' + A + '} - \\frac{1}{' + B + '}$, so the first log is positive.', tag: 'sign' }] };
  const at = (v) => (shift ? `\\ln\\frac{${v}+1}{${v}+2}` : `\\ln\\frac{${v}}{${v}+1}`);
  const loFrac = shift ? '\\frac{1}{2}' : lo === 1 ? '\\frac{1}{2}' : '\\frac{2}{3}';
  s.value = value; s.exact = exact;
  s.pieces = [{ plug: [`${at('b')} - ${at(lo)} = ${at('b')} - \\ln${loFrac}`], lim: [`\\frac{${shift ? 'b+1' : 'b'}}{${shift ? 'b+2' : 'b+1'}} \\to 1 \\;\\Rightarrow\\; \\ln 1 - \\ln${loFrac} = 0 + ${exact} = ${exact}`], why: `Combine the logs FIRST. $\\frac{${shift ? 'b+1' : 'b'}}{${shift ? 'b+2' : 'b+1'}} \\to 1$, and $\\ln 1 = 0$. Also $-\\ln${loFrac} = ${exact}$.` }];
  s.mistakes = [
    { v: DIV, tex: '\\text{Diverges}', msg: `$\\ln|${A}| - \\ln|${B}|$ looks like $\\infty - \\infty$ at the top. Combine into one log first: it goes to $\\ln 1 = 0$.`, tag: 'imp-limit', step: 4 },
    { v: -value, tex: '-' + exact, msg: `Top minus bottom: $0 - \\ln${loFrac} = +${exact}$.`, tag: 'sign', step: 3 },
    { v: 0, tex: '0', msg: `Only the $b$ part goes to 0. You still subtract $F(${lo}) = \\ln${loFrac}$.`, tag: 'imp-plug', step: 3 },
  ];
  s.hints = ['Top limit $\\infty$: use $b$.', `Partial fractions: $\\frac{1}{${A}} - \\frac{1}{${B}}$.`, 'Combine the logs before you take the limit.'];
  return build(s);
}

const FAM = { p_inf, exp_inf, exp_neg_inf, p_zero, endpoint_root, arctan_inf, shifted_inf, both_inf, interior, ln_inf, ibp_inf, pf_inf };
M.IMP_FAMILIES = FAM;
const BY_LEVEL = {
  1: [[p_inf, 4], [exp_inf, 3], [p_zero, 3], [exp_neg_inf, 2]],
  2: [[arctan_inf, 3], [shifted_inf, 2], [endpoint_root, 3], [both_inf, 2], [p_inf, 1], [ln_inf, 1], [exp_inf, 1], [p_zero, 1]],
  3: [[interior, 4], [ibp_inf, 3], [pf_inf, 3], [both_inf, 1], [ln_inf, 2], [endpoint_root, 1]],
};
M.GEN.imp = function (level, r, family) {
  const fam = family ? FAM[family] : r.pickW(BY_LEVEL[level] || BY_LEVEL[1]);
  const p = fam(level, r);
  p.level = level;
  return p;
};
})(typeof globalThis !== 'undefined' ? globalThis : this);
