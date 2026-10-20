/* ==========================================================================
   UNIT 4 — Partial Fractions
   ========================================================================== */
(function (G) {
'use strict';
const M = G.M, Q = M.Q, T = M.term, S = M.sum, pc = M.pc, st = M.st;
const mk = M.mistake;

const linTex = (r) => (r === 0 ? 'x' : `x ${r > 0 ? '-' : '+'} ${Math.abs(r)}`);
const facTex = (r) => (r === 0 ? 'x' : `(${linTex(r)})`);
const facAt = (r, x0) => (r === 0 ? `(${x0})` : `(${x0} ${r > 0 ? '-' : '+'} ${Math.abs(r)})`);
const polyVal = (c, x) => c.reduce((a, k) => a * x + k, 0);
function polyAt(coeffs, x0) {
  const deg = coeffs.length - 1; let out = '', first = true;
  coeffs.forEach((c, i) => {
    const p = deg - i; if (c === 0) return;
    const ac = Math.abs(c);
    const body = p === 0 ? `${ac}` : `${ac === 1 ? '' : ac}(${x0})${p > 1 ? `^{${p}}` : ''}`;
    out += first ? (c < 0 ? '-' : '') + body : (c < 0 ? ' - ' : ' + ') + body;
    first = false;
  });
  return out || '0';
}
const polyMul = (a, b) => { const out = new Array(a.length + b.length - 1).fill(0); a.forEach((x, i) => b.forEach((y, j) => { out[i + j] += x * y; })); return out; };
const polyAdd = (a, b) => { const n = Math.max(a.length, b.length); const A = Array(n - a.length).fill(0).concat(a), B = Array(n - b.length).fill(0).concat(b); return A.map((x, i) => x + B[i]); };
const trim = (c) => { let i = 0; while (i < c.length - 1 && c[i] === 0) i++; return c.slice(i); };
const lnLin = (r) => pc.Ln(M.lin(r));
const fracPiece = (num, r) => pc.Raw(`\\frac{${num}}{${linTex(r)}}`, `${num}/(${M.lin(r).ascii})`, (x) => num / (x - r));
const qv = (q) => Q.val(q);
const proper = (degN, degD) => st.choice('Proper or improper?', [
  { text: `Proper (top degree ${degN} < bottom degree ${degD}): go straight to partial fractions`, ok: degN < degD },
  { text: 'Improper: long division first', ok: degN >= degD, msg: degN < degD ? `The top has degree ${degN}, the bottom ${degD}. Top smaller means proper.` : undefined },
].map((o) => (o.ok ? { text: o.text, ok: true } : { text: o.text, msg: o.msg || `Top degree ${degN} ≥ bottom degree ${degD}: improper, so divide first.` })), 1);
function rootsDomain(roots) {
  const mx = Math.max(...roots), mn = Math.min(...roots);
  const sorted = roots.slice().sort((a, b) => a - b);
  let gapLo = sorted[0], gapHi = sorted[1];
  return { domain: [mx + 0.35, mx + 3.4], absDomain: gapHi - gapLo >= 1 ? [gapLo + 0.2, gapHi - 0.2] : [mn - 3, mn - 0.4] };
}

/* ---------- distinct linear (2 factors) ---------- */
function distinct2(level, r, fx = {}) {
  let r1, r2, A, B;
  if (fx.special || (level === 1 && r.chance(0.3))) {
    // ∫ c/(x² − a²)
    const a = r.pick([1, 2, 3, 4]); const c = r.pick([1, 2, 2 * a]);
    r1 = a; r2 = -a; A = Q(c, 2 * a); B = Q(-c, 2 * a);
  } else {
    const R = level === 1 ? [-3, -2, -1, 0, 1, 2, 3] : [-4, -3, -2, -1, 0, 1, 2, 3, 4];
    r1 = r.pick(R); do { r2 = r.pick(R); } while (r2 === r1);
    if (r1 < r2) [r1, r2] = [r2, r1];
    const AB = [-4, -3, -2, -1, 1, 2, 3, 4, 5];
    do { A = Q(r.pick(AB)); B = Q(r.pick(AB)); } while (Q.val(A) === 1 && Q.val(B) === 1);
  }
  const den = [1, -(r1 + r2), r1 * r2];
  // N = A(x − r2) + B(x − r1)
  const N = trim(polyAdd(polyMul([qv(A)], [1, -r2]), polyMul([qv(B)], [1, -r1])));
  const Nint = N.every((c) => Number.isInteger(c));
  if (!Nint) return null;
  const Np = M.poly(N), Dp = M.poly(den);
  const ans = S([T(A, [lnLin(r1)]), T(B, [lnLin(r2)])]);
  const { domain, absDomain } = rootsDomain([r1, r2]);
  const fac = `${facTex(r1)}${facTex(r2)}`;
  const facOpts = [
    { tex: fac, ok: true },
    { tex: `${facTex(-r1)}${facTex(-r2)}`, msg: `Check by plugging in: the roots of $${Dp.tex}$ are ${r1} and ${r2}.` },
    { tex: `${facTex(r1)}${facTex(-r2)}`, msg: 'Multiply it back out: the middle term will not match.' },
    { tex: `${facTex(-r1)}${facTex(r2)}`, msg: 'Multiply it back out: the middle term will not match.' },
  ].filter((o, i, arr) => arr.findIndex((p) => p.tex === o.tex) === i);
  const vA = polyVal(N, r1), vB = polyVal(N, r2);
  const mistakes = [
    !Q.eq(A, B) ? mk(S([T(B, [lnLin(r1)]), T(A, [lnLin(r2)])]), 'constants', 'Your A and B got swapped. A goes with the factor you plugged its root into.', 3) : null,
    (r1 !== 0 || r2 !== 0) ? mk(S([T(A, [lnLin(-r1)]), T(B, [lnLin(-r2)])]), 'factor', `Sign check on the factors: a root at $x = ${r1}$ means a factor $(${linTex(r1)})$.`, 1) : null,
    mk(S([T(1, [pc.Ln(Dp)])]), 'pf-skip', 'You cannot $\\ln$ the whole bottom unless the top is exactly its derivative. Split it with partial fractions first.', 2),
    mk(S([T(1, [lnLin(r1)]), T(1, [lnLin(r2)])]), 'constants', 'The constants A and B multiply the logs.', 5),
    mk(S([T(A, [lnLin(r1)]), T(Q.neg(B), [lnLin(r2)])]), 'sign', 'Sign slip on one constant.', 4),
  ];
  return {
    family: 'distinct2', famLabel: 'two linear factors', level: 1,
    tex: `\\int \\frac{${Np.tex}}{${Dp.tex}}\\,dx`, f: (x) => polyVal(N, x) / polyVal(den, x), domain, absDomain, answer: ans, mistakes,
    hints: ['Top degree is less than bottom degree, so it is proper. Factor the bottom.', `$${Dp.tex} = ${fac}$. Write $\\frac{A}{${linTex(r1)}} + \\frac{B}{${linTex(r2)}}$.`, `Cover-up: plug $x = ${r1}$ to get A, $x = ${r2}$ to get B.`],
    steps: [
      { title: 'Degree check', think: 'Compare the highest powers, top vs. bottom. Top degree ≥ bottom degree means long division first.', lines: [`\\deg(\\text{top}) = ${N.length - 1},\\; \\deg(\\text{bottom}) = 2`], check: proper(N.length - 1, 2), tag: 'pf-division' },
      { title: 'Factor the bottom', think: `Find two numbers that multiply to ${r1 * r2} and add to ${-(r1 + r2)}.`, lines: [`${Dp.tex} = ${fac}`], check: st.choice(`$${Dp.tex} = \\;?$`, facOpts, 2), tag: 'factor' },
      { title: 'Set up the template', think: 'One fraction per linear factor, a constant on top. Multiply both sides by the whole bottom: that is the basic equation.', lines: [`\\frac{${Np.tex}}{${fac}} = \\frac{A}{${linTex(r1)}} + \\frac{B}{${linTex(r2)}}`, `${Np.tex} = A${facTex(r2)} + B${facTex(r1)}`], check: null, tag: 'pf-setup' },
      { title: `Heaviside: x = ${r1} gives A`, think: `Cover-up trick: plug $x = ${r1}$ into the basic equation and the B term vanishes. Plug in fully first.`, lines: [`${polyAt(N, r1)} = A${facAt(r2, r1)} + B${facAt(r1, r1)}`, `${vA} = ${r1 - r2}A \\;\\Rightarrow\\; A = ${Q.tex(A)}`], check: st.num('A =', qv(A), { points: 3, answerTex: Q.tex(A) }), tag: 'constants' },
      { title: `Heaviside: x = ${r2} gives B`, think: `Now $x = ${r2}$ makes the A term vanish.`, lines: [`${polyAt(N, r2)} = A${facAt(r2, r2)} + B${facAt(r1, r2)}`, `${vB} = ${r2 - r1}B \\;\\Rightarrow\\; B = ${Q.tex(B)}`], check: st.num('B =', qv(B), { points: 3, answerTex: Q.tex(B) }), tag: 'constants' },
      { title: 'Integrate each piece + C', think: '$\\int\\frac{A}{x - r}dx = A\\ln|x - r|$. Keep the absolute values.', lines: [`\\int \\left(\\frac{${Q.tex(A)}}{${linTex(r1)}} + \\frac{${Q.tex(B)}}{${linTex(r2)}}\\right)dx = ${ans.tex} + C`], check: st.final(3), tag: 'abs' },
    ],
  };
}

/* ---------- distinct linear (3 factors, one is x) ---------- */
function distinct3(level, r) {
  const R = [-3, -2, -1, 1, 2, 3];
  const r1 = 0; let r2 = r.pick(R), r3; do { r3 = r.pick(R); } while (r3 === r2);
  if (r2 < r3) [r2, r3] = [r3, r2];
  const AB = [-3, -2, -1, 1, 2, 3, 4];
  const A = r.pick(AB), B = r.pick(AB), C = r.pick(AB);
  const den = polyMul(polyMul([1, 0], [1, -r2]), [1, -r3]);
  const N = trim(polyAdd(polyAdd(polyMul([A], polyMul([1, -r2], [1, -r3])), polyMul([B], polyMul([1, 0], [1, -r3]))), polyMul([C], polyMul([1, 0], [1, -r2]))));
  const Np = M.poly(N), Dp = M.poly(den);
  const ans = S([T(A, [lnLin(0)]), T(B, [lnLin(r2)]), T(C, [lnLin(r3)])]);
  const { domain, absDomain } = rootsDomain([0, r2, r3]);
  const fac = `x${facTex(r2)}${facTex(r3)}`;
  return {
    family: 'distinct3', famLabel: 'three linear factors', level: 2,
    tex: `\\int \\frac{${Np.tex}}{${Dp.tex}}\\,dx`, f: (x) => polyVal(N, x) / polyVal(den, x), domain, absDomain, answer: ans,
    mistakes: [
      mk(S([T(A, [lnLin(0)]), T(C, [lnLin(r2)]), T(B, [lnLin(r3)])]), 'constants', 'B and C got swapped.', 4),
      mk(S([T(A, [lnLin(0)]), T(B, [lnLin(-r2)]), T(C, [lnLin(-r3)])]), 'factor', 'Sign check on the factors.', 1),
      mk(S([T(1, [pc.Ln(Dp)])]), 'pf-skip', 'You cannot $\\ln$ the whole bottom. Split first.', 2),
      mk(S([T(A, [lnLin(0)]), T(B, [lnLin(r2)]), T(-C, [lnLin(r3)])]), 'sign', 'Sign slip on C.', 5),
    ],
    hints: ['Factor out an $x$ first, then factor the quadratic.', `$${Dp.tex} = ${fac}$.`, 'Three factors, three constants. Plug in each root.'],
    steps: [
      { title: 'Degree check', think: 'Compare the highest powers, top vs. bottom.', lines: [`\\deg(\\text{top}) = ${N.length - 1} < 3`], check: proper(N.length - 1, 3), tag: 'pf-division' },
      { title: 'Factor the bottom', think: 'Pull out the common $x$, then factor what is left.', lines: [`${Dp.tex} = ${fac}`], check: st.choice(`$${Dp.tex} = \\;?$`, [{ tex: fac, ok: true }, { tex: `x${facTex(-r2)}${facTex(-r3)}`, msg: 'Check the signs by plugging the roots back in.' }, { tex: `x^{2}${facTex(r2 + r3)}`, msg: 'Only one $x$ factors out.' }], 2), tag: 'factor' },
      { title: 'Set up the template', think: 'One constant per linear factor. Multiply by the whole bottom to get the basic equation.', lines: [`\\frac{${Np.tex}}{${fac}} = \\frac{A}{x} + \\frac{B}{${linTex(r2)}} + \\frac{C}{${linTex(r3)}}`, `${Np.tex} = A${facTex(r2)}${facTex(r3)} + Bx${facTex(r3)} + Cx${facTex(r2)}`], check: null, tag: 'pf-setup' },
      { title: 'Heaviside: x = 0 gives A', think: 'Cover-up trick: at $x = 0$ only the A term survives.', lines: [`${polyAt(N, 0)} = A${facAt(r2, 0)}${facAt(r3, 0)} \\;\\Rightarrow\\; ${polyVal(N, 0)} = ${r2 * r3}A`], check: st.num('A =', A, { points: 2, answerTex: `${A}` }), tag: 'constants' },
      { title: `Heaviside: x = ${r2} gives B`, think: 'Only the B term survives.', lines: [`${polyAt(N, r2)} = B(${r2})${facAt(r3, r2)} \\;\\Rightarrow\\; ${polyVal(N, r2)} = ${r2 * (r2 - r3)}B`], check: st.num('B =', B, { points: 2, answerTex: `${B}` }), tag: 'constants' },
      { title: `Heaviside: x = ${r3} gives C`, think: 'Only the C term survives.', lines: [`${polyAt(N, r3)} = C(${r3})${facAt(r2, r3)} \\;\\Rightarrow\\; ${polyVal(N, r3)} = ${r3 * (r3 - r2)}C`], check: st.num('C =', C, { points: 2, answerTex: `${C}` }), tag: 'constants' },
      { title: 'Integrate each piece + C', think: 'Three logs, absolute values on all of them.', lines: [`= ${ans.tex} + C`], check: st.final(3), tag: 'abs' },
    ],
  };
}

/* ---------- repeated linear ---------- */
function repeated(level, r) {
  const simple = level === 1 || r.chance(0.3);
  const R = [-3, -2, -1, 1, 2, 3];
  if (simple) {
    const rr = r.pick(R.concat([0]).filter((x) => x !== 0));
    const A = r.pick([1, 2, 3, -1, -2]), B = r.pick([1, 2, 3, -1, -2, 4]);
    const N = trim([A, B - A * rr]);
    const Np = M.poly(N);
    const ans = S([T(A, [lnLin(rr)]), T(-1, [fracPiece(B, rr)])]);
    const domain = [rr + 0.35, rr + 3.4], absDomain = [rr - 3, rr - 0.4];
    return {
      family: 'repeated', famLabel: 'repeated factor', level: 1,
      tex: `\\int \\frac{${Np.tex}}{(${linTex(rr)})^{2}}\\,dx`, f: (x) => polyVal(N, x) / (x - rr) ** 2, domain, absDomain, answer: ans,
      mistakes: [
        mk(S([T(A, [lnLin(rr)]), T(1, [fracPiece(B, rr)])]), 'sign', `$\\int\\frac{B}{(x-r)^2}dx = -\\frac{B}{x - r}$ (power rule with $-2$ gives a minus).`, 3),
        mk(S([T(A + B, [lnLin(rr)])]), 'power', '$\\frac{B}{(x-r)^2}$ is not a log. Power rule: $\\int (x-r)^{-2}dx = -(x-r)^{-1}$.', 3),
        mk(S([T(1, [pc.Ln(M.P(`(${linTex(rr)})^{2}`, '', (x) => (x - rr) ** 2))])]), 'pf-skip', 'Split it first. The top is not the derivative of the bottom.', 0),
        mk(S([T(B, [lnLin(rr)]), T(-1, [fracPiece(A, rr)])]), 'constants', 'A and B got swapped.', 2),
      ],
      hints: ['Repeated factor: one fraction for each power.', `$\\frac{A}{${linTex(rr)}} + \\frac{B}{(${linTex(rr)})^2}$.`, '$\\int\\frac{B}{(x-r)^2}dx = -\\frac{B}{x-r}$.'],
      steps: [
        { title: 'Set up the template', think: 'A repeated factor $(x - r)^2$ gets a fraction for $(x-r)$ AND one for $(x-r)^2$.', lines: [`\\frac{${Np.tex}}{(${linTex(rr)})^{2}} = \\frac{A}{${linTex(rr)}} + \\frac{B}{(${linTex(rr)})^{2}}`], check: st.choice('Which setup?', [{ tex: `\\frac{A}{${linTex(rr)}} + \\frac{B}{(${linTex(rr)})^{2}}`, ok: true }, { tex: `\\frac{A}{(${linTex(rr)})^{2}}`, msg: 'One term per power: you need both $(x-r)$ and $(x-r)^2$.' }, { tex: `\\frac{A}{${linTex(rr)}} + \\frac{B}{${linTex(-rr)}}`, msg: 'The factor is repeated, not two different factors.' }], 3), tag: 'pf-setup' },
        { title: 'Matching coefficients: A', think: `Basic equation: $${Np.tex} = A(${linTex(rr)}) + B$. Match the $x$ coefficients on both sides.`, lines: [`${Np.tex} = A(${linTex(rr)}) + B \\;\\Rightarrow\\; A = ${A}`], check: st.num('A =', A, { points: 2, answerTex: `${A}` }), tag: 'constants' },
        { title: `Heaviside: x = ${rr} gives B`, think: `$x = ${rr}$ makes the A term vanish.`, lines: [`${polyAt(N, rr)} = A(0) + B \\;\\Rightarrow\\; B = ${B}`], check: st.num('B =', B, { points: 2, answerTex: `${B}` }), tag: 'constants' },
        { title: 'Integrate each piece + C', think: '$\\frac{A}{x - r}$ gives a log. $\\frac{B}{(x-r)^2}$ uses the power rule: $-\\frac{B}{x - r}$.', lines: [`= ${ans.tex} + C`], check: st.final(5), tag: 'power' },
      ],
    };
  }
  const rr = r.pick(R); let s; do { s = r.pick(R); } while (s === rr);
  const A = r.pick([1, 2, -1, -2, 3]), B = r.pick([1, 2, 3, -1, -2]), C = r.pick([1, 2, -1, -2, 3]);
  // N = A(x − r)(x − s) + B(x − s) + C(x − r)²
  const N = trim(polyAdd(polyAdd(polyMul([A], polyMul([1, -rr], [1, -s])), polyMul([B], [1, -s])), polyMul([C], polyMul([1, -rr], [1, -rr]))));
  const Np = M.poly(N);
  const ans = S([T(A, [lnLin(rr)]), T(-1, [fracPiece(B, rr)]), T(C, [lnLin(s)])]);
  const { domain, absDomain } = rootsDomain([rr, s]);
  const denTex = `(${linTex(rr)})^{2}${facTex(s)}`;
  const N2 = N.length === 3 ? N[0] : 0;
  return {
    family: 'repeated', famLabel: 'repeated + distinct', level: 2,
    tex: `\\int \\frac{${Np.tex}}{${denTex}}\\,dx`, f: (x) => polyVal(N, x) / ((x - rr) ** 2 * (x - s)), domain, absDomain, answer: ans,
    mistakes: [
      mk(S([T(A + B, [lnLin(rr)]), T(C, [lnLin(s)])]), 'power', '$\\frac{B}{(x-r)^2}$ integrates with the power rule, not to a log.', 4),
      mk(S([T(A, [lnLin(rr)]), T(1, [fracPiece(B, rr)]), T(C, [lnLin(s)])]), 'sign', '$\\int (x-r)^{-2}dx = -(x-r)^{-1}$: minus sign.', 4),
      mk(S([T(A, [lnLin(rr)]), T(C, [lnLin(s)])]), 'pf-setup', 'You are missing the $\\frac{B}{(x-r)^2}$ piece. Repeated factors get one fraction per power.', 0),
      mk(S([T(C, [lnLin(rr)]), T(-1, [fracPiece(B, rr)]), T(A, [lnLin(s)])]), 'constants', 'A and C got swapped.', 3),
    ],
    hints: ['Repeated factor: one fraction for each power, plus one for the other factor.', `$\\frac{A}{${linTex(rr)}} + \\frac{B}{(${linTex(rr)})^2} + \\frac{C}{${linTex(s)}}$.`, `Plug $x = ${rr}$ for B and $x = ${s}$ for C; match $x^2$ coefficients for A.`],
    steps: [
      { title: 'Set up the template', think: 'Repeated $(x-r)^2$: fractions for $(x-r)$ and $(x-r)^2$. Plus one for the other factor.', lines: [`\\frac{${Np.tex}}{${denTex}} = \\frac{A}{${linTex(rr)}} + \\frac{B}{(${linTex(rr)})^{2}} + \\frac{C}{${linTex(s)}}`, `${Np.tex} = A${facTex(rr)}${facTex(s)} + B${facTex(s)} + C${facTex(rr)}^{2}`], check: st.choice('Which setup?', [{ tex: `\\frac{A}{${linTex(rr)}} + \\frac{B}{(${linTex(rr)})^{2}} + \\frac{C}{${linTex(s)}}`, ok: true }, { tex: `\\frac{A}{(${linTex(rr)})^{2}} + \\frac{B}{${linTex(s)}}`, msg: 'A repeated factor needs one fraction for EACH power.' }, { tex: `\\frac{A}{${linTex(rr)}} + \\frac{B}{${linTex(s)}}`, msg: 'The squared factor needs its own $(x-r)^2$ fraction too.' }], 3), tag: 'pf-setup' },
      { title: `Heaviside: x = ${rr} gives B`, think: 'Only the B term survives.', lines: [`${polyAt(N, rr)} = B${facAt(s, rr)} \\;\\Rightarrow\\; ${polyVal(N, rr)} = ${rr - s}B`], check: st.num('B =', B, { points: 2, answerTex: `${B}` }), tag: 'constants' },
      { title: `Heaviside: x = ${s} gives C`, think: 'Only the C term survives.', lines: [`${polyAt(N, s)} = C${facAt(rr, s)}^{2} \\;\\Rightarrow\\; ${polyVal(N, s)} = ${(s - rr) ** 2}C`], check: st.num('C =', C, { points: 2, answerTex: `${C}` }), tag: 'constants' },
      { title: 'Matching coefficients: x² gives A', think: 'No root kills everything but A. Compare $x^2$ coefficients on both sides: $A + C$ on the right.', lines: [`x^{2}:\\; ${N2} = A + C = A + ${C} \\;\\Rightarrow\\; A = ${A}`], check: st.num('A =', A, { points: 2, answerTex: `${A}` }), tag: 'constants' },
      { title: 'Integrate each piece + C', think: 'Logs for the linear pieces, power rule for the squared one.', lines: [`= ${ans.tex} + C`], check: st.final(3), tag: 'power' },
    ],
  };
}

/* ---------- irreducible quadratic ---------- */
function irreducible(level, r) {
  const rr = r.pick([1, 2, -1, -2, 3]);
  const k = r.pick([1, 2, 3, 1]);
  const k2 = k * k;
  const A = r.pick([1, 2, -1, 3, -2]);
  const B = r.pick([2, -2, 1, -1, 4]);
  let C = r.pick([1, 2, 3, -1, -2, -3]);
  // N = A(x² + k²) + (Bx + C)(x − r)
  const N = trim(polyAdd(polyMul([A], [1, 0, k2]), polyMul([B, C], [1, -rr])));
  const Np = M.poly(N);
  const quad = M.poly([1, 0, k2]);
  const LnQ = pc.Ln(quad, false);
  const At = pc.Arc('arctan', k === 1 ? M.P('x', 'x', (x) => x) : M.P(`\\frac{x}{${k}}`, `x/${k}`, (x) => x / k));
  const ans = S([T(A, [lnLin(rr)]), T(Q(B, 2), [LnQ]), T(Q(C, k), [At])]);
  const domain = [rr + 0.35, rr + 3.4], absDomain = [rr - 3, rr - 0.4];
  const denTex = `${facTex(rr)}(x^{2} + ${k2})`;
  return {
    family: 'irreducible', famLabel: 'irreducible quadratic', level: 3,
    tex: `\\int \\frac{${Np.tex}}{${denTex}}\\,dx`, f: (x) => polyVal(N, x) / ((x - rr) * (x * x + k2)), domain, absDomain, answer: ans,
    mistakes: [
      mk(S([T(A, [lnLin(rr)]), T(B, [LnQ]), T(Q(C, k), [At])]), 'kfactor', '$\\int\\frac{Bx}{x^2+k^2}dx = \\frac{B}{2}\\ln(x^2+k^2)$: u-sub gives a $\\frac12$.', 4),
      k !== 1 ? mk(S([T(A, [lnLin(rr)]), T(Q(B, 2), [LnQ]), T(C, [At])]), 'kfactor', `$\\int\\frac{C}{x^2+${k2}}dx = \\frac{C}{${k}}\\arctan\\frac{x}{${k}}$. Keep the $\\frac{1}{${k}}$.`, 4) : null,
      k !== 1 ? mk(S([T(A, [lnLin(rr)]), T(Q(B, 2), [LnQ]), T(Q(C, k), [pc.Arc('arctan', M.P(`${k}x`, `${k}x`, (x) => k * x))])]), 'algebra', `Inside the arctan it is $\\frac{x}{${k}}$.`, 4) : mk(S([T(A, [lnLin(rr)]), T(Q(B + C, 2), [LnQ])]), 'usub', 'The $C$ part gives arctan, not another log.', 4),
      mk(S([T(A, [lnLin(rr)]), T(B, [lnLin(-k)]), T(C, [lnLin(k)])]), 'pf-setup', `$x^2 + ${k2}$ does not factor over the reals. Use $\\frac{Bx + C}{x^2 + ${k2}}$.`, 0),
    ],
    hints: ['Irreducible quadratic on the bottom: its fraction gets a linear top, $\\frac{Bx+C}{x^2+k^2}$.', `Plug $x = ${rr}$ for A. Then plug $x = 0$ and match $x^2$ coefficients.`, '$\\frac{Bx}{x^2+k^2}$ → $\\frac{B}{2}\\ln$, and $\\frac{C}{x^2+k^2}$ → $\\frac{C}{k}\\arctan\\frac{x}{k}$.'],
    steps: [
      { title: 'Set up the template', think: `$x^2 + ${k2}$ can't be factored (it's never 0). Over an irreducible quadratic, the top is linear: $Bx + C$.`, lines: [`\\frac{${Np.tex}}{${denTex}} = \\frac{A}{${linTex(rr)}} + \\frac{Bx + C}{x^{2} + ${k2}}`, `${Np.tex} = A(x^{2} + ${k2}) + (Bx + C)${facTex(rr)}`], check: st.choice('Which setup?', [{ tex: `\\frac{A}{${linTex(rr)}} + \\frac{Bx + C}{x^{2} + ${k2}}`, ok: true }, { tex: `\\frac{A}{${linTex(rr)}} + \\frac{B}{x^{2} + ${k2}}`, msg: 'Over a quadratic, the top must be linear: $Bx + C$.' }, { tex: `\\frac{A}{${linTex(rr)}} + \\frac{B}{${linTex(k)}} + \\frac{C}{${linTex(-k)}}`, msg: `$x^2 + ${k2}$ does not factor over the reals. That is $x^2 - ${k2}$.` }], 3), tag: 'pf-setup' },
      { title: `Heaviside: x = ${rr} gives A`, think: 'The $(Bx + C)$ term vanishes.', lines: [`${polyAt(N, rr)} = A\\left((${rr})^{2} + ${k2}\\right) \\;\\Rightarrow\\; ${polyVal(N, rr)} = ${rr * rr + k2}A`], check: st.num('A =', A, { points: 2, answerTex: `${A}` }), tag: 'constants' },
      { title: 'Plug in x = 0 to get C', think: 'With $x = 0$: $N(0) = A\\cdot ' + k2 + ' + C\\cdot(0 - ' + rr + ')$. You already know A.', lines: [`${polyVal(N, 0)} = ${A}(${k2}) + C(${-rr}) \\;\\Rightarrow\\; C = ${C}`], check: st.num('C =', C, { points: 2, answerTex: `${C}` }), tag: 'constants' },
      { title: 'Matching coefficients: x² gives B', think: 'Expand the basic equation: the $x^2$ coefficient on the right is $A + B$.', lines: [`x^{2}:\\; ${N[0]} = A + B = ${A} + B \\;\\Rightarrow\\; B = ${B}`], check: st.num('B =', B, { points: 2, answerTex: `${B}` }), tag: 'constants' },
      { title: 'Integrate each piece + C', think: `Split $\\frac{${B}x + ${C}}{x^2+${k2}}$ into a log piece ($u = x^2 + ${k2}$) and an arctan piece.`, lines: [`\\int\\frac{${B}x}{x^{2}+${k2}}dx = ${Q.tex(Q(B, 2))}\\ln(x^{2}+${k2}),\\quad \\int\\frac{${C}}{x^{2}+${k2}}dx = ${Q.tex(Q(C, k))}\\arctan\\left(${k === 1 ? 'x' : `\\frac{x}{${k}}`}\\right)`, `= ${ans.tex} + C`], check: st.final(3), tag: 'kfactor' },
    ],
  };
}

/* ---------- improper: divide first ---------- */
function improper(level, r) {
  const lin = level >= 3;
  let r1 = r.pick([-3, -2, -1, 0, 1, 2, 3]), r2; do { r2 = r.pick([-3, -2, -1, 0, 1, 2, 3]); } while (r2 === r1);
  if (r1 < r2) [r1, r2] = [r2, r1];
  const A = r.pick([1, 2, -1, 3, -2]), B = r.pick([1, -1, 2, -2, 3]);
  const den = [1, -(r1 + r2), r1 * r2];
  const q0 = r.pick([0, 1, -1, 2]);
  const Qp = lin ? [1, q0] : [r.pick([1, 2])];
  const R = trim(polyAdd(polyMul([A], [1, -r2]), polyMul([B], [1, -r1])));
  const N = trim(polyAdd(polyMul(Qp, den), R));
  const Np = M.poly(N), Dp = M.poly(den), Qpp = M.poly(Qp), Rp = M.poly(R);
  const polyPart = lin ? [T(Q(1, 2), [pc.X(2)], 'over'), T(q0, [pc.X(1)])] : [T(Qp[0], [pc.X(1)])];
  const ans = S(polyPart.concat([T(A, [lnLin(r1)]), T(B, [lnLin(r2)])]));
  const { domain, absDomain } = rootsDomain([r1, r2]);
  const fac = `${facTex(r1)}${facTex(r2)}`;
  const wrongQ = M.poly(lin ? [1, q0 + 1] : [Qp[0] + 1]);
  const divRes = `${Qpp.tex} + \\frac{${Rp.tex}}{${Dp.tex}}`;
  return {
    family: 'improper', famLabel: 'improper (divide first)', level: lin ? 3 : 2,
    tex: `\\int \\frac{${Np.tex}}{${Dp.tex}}\\,dx`, f: (x) => polyVal(N, x) / polyVal(den, x), domain, absDomain, answer: ans,
    mistakes: [
      mk(S([T(A, [lnLin(r1)]), T(B, [lnLin(r2)])]), 'pf-division', 'You skipped the polynomial part from the long division.', 1),
      lin ? mk(S([T(1, [pc.X(1)]), T(A, [lnLin(r1)]), T(B, [lnLin(r2)])]), 'power', 'Integrate the quotient too: $\\int(x + c)\\,dx = \\frac{x^2}{2} + cx$.', 4) : mk(S([T(Qp[0] + 1, [pc.X(1)]), T(A, [lnLin(r1)]), T(B, [lnLin(r2)])]), 'pf-division', 'Check the quotient: multiply it back by the bottom.', 1),
      !(A === B) ? mk(S(polyPart.concat([T(B, [lnLin(r1)]), T(A, [lnLin(r2)])])), 'constants', 'A and B got swapped.', 3) : null,
      mk(S([T(1, [pc.Ln(Dp)])]), 'pf-skip', 'Divide first, then split. You cannot just take $\\ln$ of the bottom.', 0),
    ],
    hints: [`Top degree ${N.length - 1} ≥ bottom degree 2: long division first.`, `$\\frac{${Np.tex}}{${Dp.tex}} = ${divRes}$.`, 'Then partial fractions on the remainder piece.'],
    steps: [
      { title: 'Degree check', think: 'Compare the highest powers. Top degree ≥ bottom degree: this one is improper.', lines: [`\\deg(\\text{top}) = ${N.length - 1} \\ge \\deg(\\text{bottom}) = 2 \\Rightarrow \\text{divide first}`], check: proper(N.length - 1, 2), tag: 'pf-division' },
      { title: 'Long division first', think: 'Divide the top by the bottom, writing a 0 for any missing power. Check: quotient × bottom + remainder = top.', lines: [`\\text{Quotient} = ${Qpp.tex}, \\qquad \\text{Remainder} = ${Rp.tex}`, `\\text{Check: } (${Qpp.tex})(${Dp.tex}) + (${Rp.tex}) = ${Np.tex}`, `\\frac{${Np.tex}}{${Dp.tex}} = ${divRes}`], check: st.choice('The division gives:', [{ tex: divRes, ok: true }, { tex: `${wrongQ.tex} + \\frac{${Rp.tex}}{${Dp.tex}}`, msg: 'Multiply the quotient back by the bottom: it overshoots the top.' }, { tex: `${Qpp.tex} - \\frac{${Rp.tex}}{${Dp.tex}}`, msg: 'Remainder sign: top minus (quotient × bottom).' }], 3), tag: 'pf-division' },
      { title: `Heaviside on the remainder: x = ${r1} gives A`, think: `Split $\\frac{${Rp.tex}}{${fac}} = \\frac{A}{${linTex(r1)}} + \\frac{B}{${linTex(r2)}}$. Plug in $x = ${r1}$.`, lines: [`${polyAt(R, r1)} = A${facAt(r2, r1)} \\;\\Rightarrow\\; A = ${A}`], check: st.num('A =', A, { points: 2, answerTex: `${A}` }), tag: 'constants' },
      { title: `Heaviside on the remainder: x = ${r2} gives B`, think: `Plug in $x = ${r2}$.`, lines: [`${polyAt(R, r2)} = B${facAt(r1, r2)} \\;\\Rightarrow\\; B = ${B}`], check: st.num('B =', B, { points: 2, answerTex: `${B}` }), tag: 'constants' },
      { title: 'Integrate everything + C', think: 'Integrate the quotient (power rule) plus the two logs.', lines: [`= ${ans.tex} + C`], check: st.final(4), tag: 'pf-division' },
    ],
  };
}

/* ---------- split (px + q)/(x² + k²) ---------- */
function split(level, r) {
  const p = r.pick([1, 2, 3, 4, 6]), q = r.pick([1, 2, 3, -1, -2, 4, 5]), k = r.pick([1, 2, 3]);
  const k2 = k * k;
  const quad = M.poly([1, 0, k2]);
  const LnQ = pc.Ln(quad, false);
  const At = pc.Arc('arctan', k === 1 ? M.P('x', 'x', (x) => x) : M.P(`\\frac{x}{${k}}`, `x/${k}`, (x) => x / k));
  const ans = S([T(Q(p, 2), [LnQ]), T(Q(q, k), [At])]);
  const Np = M.poly([p, q]);
  const domain = [-2.4, 2.8];
  return {
    family: 'split', famLabel: '(px+q)/(x²+k²)', level: 1,
    tex: `\\int \\frac{${Np.tex}}{x^{2}+${k2}}\\,dx`, f: (x) => (p * x + q) / (x * x + k2), domain, answer: ans,
    mistakes: [
      mk(S([T(p, [LnQ]), T(Q(q, k), [At])]), 'kfactor', `$u = x^2 + ${k2}$, $du = 2x\\,dx$: that gives a $\\frac{1}{2}$ in front of the log.`, 1),
      k !== 1 ? mk(S([T(Q(p, 2), [LnQ]), T(q, [At])]), 'kfactor', `$\\int\\frac{dx}{x^2+${k2}} = \\frac{1}{${k}}\\arctan\\frac{x}{${k}}$.`, 2) : null,
      mk(S([T(Q(p + q, 2), [LnQ])]), 'usub', 'Only the $x$ part has its derivative on top. The constant part becomes arctan.', 0),
      mk(S([T(Q(p, 2), [LnQ]), T(Q(-q, k), [At])]), 'sign', 'Sign slip on the arctan piece.', 3),
    ],
    hints: ['Split the fraction into an $x$-part and a constant part.', `$\\frac{${p}x}{x^2+${k2}}$: u-sub with $u = x^2+${k2}$.`, `$\\frac{${q}}{x^2+${k2}}$: arctan formula.`],
    steps: [
      { title: 'Split the top', think: `$x^2 + ${k2}$ won't factor, so split the numerator: the $x$ part pairs with u-sub, the constant pairs with arctan.`, lines: [`\\frac{${Np.tex}}{x^{2}+${k2}} = \\frac{${p === 1 ? '' : p}x}{x^{2}+${k2}} + \\frac{${q}}{x^{2}+${k2}}`], check: st.choice('Best first move?', [{ tex: `\\frac{${p === 1 ? '' : p}x}{x^{2}+${k2}} + \\frac{${q}}{x^{2}+${k2}}`, ok: true }, { tex: `\\frac{A}{${linTex(k)}} + \\frac{B}{${linTex(-k)}}`, msg: `$x^2 + ${k2}$ does not factor (that would be $x^2 - ${k2}$).` }, { tex: `u = x^{2}+${k2}\\text{ for the whole thing}`, msg: 'Only the $x$ part has the derivative $2x$ on top.' }], 3), tag: 'pf-setup' },
      { title: 'The log piece', think: `$u = x^2 + ${k2}$, $du = 2x\\,dx$.`, lines: [`\\int\\frac{${p === 1 ? '' : p}x}{x^{2}+${k2}}dx = ${Q.tex(Q(p, 2))}\\ln(x^{2}+${k2})`], check: st.expr(`\\int\\frac{${p === 1 ? '' : p}x}{x^{2}+${k2}}dx =`, { expect: (x) => (p / 2) * Math.log(x * x + k2), exact: false, domain, mistakes: [{ f: (x) => p * Math.log(x * x + k2), msg: '$du = 2x\\,dx$, so a $\\frac12$ appears.', tag: 'kfactor' }], points: 3, answerTex: `${Q.tex(Q(p, 2))}\\ln(x^{2}+${k2})` }), tag: 'kfactor' },
      { title: 'The arctan piece', think: '$\\int\\frac{dx}{x^2 + k^2} = \\frac{1}{k}\\arctan\\frac{x}{k}$.', lines: [`\\int\\frac{${q}}{x^{2}+${k2}}dx = ${Q.tex(Q(q, k))}\\arctan\\left(${k === 1 ? 'x' : `\\frac{x}{${k}}`}\\right)`], check: st.expr(`\\int\\frac{${q}}{x^{2}+${k2}}dx =`, { expect: (x) => (q / k) * Math.atan(x / k), exact: false, domain, mistakes: k !== 1 ? [{ f: (x) => q * Math.atan(x / k), msg: `Keep the $\\frac{1}{${k}}$.`, tag: 'kfactor' }] : [], points: 3, answerTex: `${Q.tex(Q(q, k))}\\arctan\\left(${k === 1 ? 'x' : `\\frac{x}{${k}}`}\\right)` }), tag: 'kfactor' },
      { title: 'Add them + C', think: 'Combine both pieces.', lines: [`= ${ans.tex} + C`], check: st.final(3), tag: 'algebra' },
    ],
  };
}

/* ---------- improper over a linear bottom: long division does the whole job (class Example 1) ---------- */
/** every power written out, 0s included: x^3 + 0x^2 + x + 0 */
function fullPoly(c) {
  const d = c.length - 1;
  return c.map((k, i) => {
    const p = d - i, xs = p === 0 ? '' : p === 1 ? 'x' : `x^{${p}}`, a = Math.abs(k);
    const body = k === 0 ? `0${xs}` : p === 0 ? `${a}` : `${a === 1 ? '' : a}${xs}`;
    return i === 0 ? (k < 0 ? '-' : '') + body : (k < 0 ? ' - ' : ' + ') + body;
  }).join('');
}
function divide_lin(level, r, fx = {}) {
  const rr = fx.r ?? r.pick([1, 2, -1, -2, 3, 1]);
  const cubic = fx.cubic ?? (level >= 2 || r.chance(0.5));
  const Qc = fx.Q ?? (cubic ? [1, r.pick([0, 1, -1, 2, 1]), r.pick([1, 2, -1, 3, 2])] : [r.pick([1, 2, 1]), r.pick([0, 1, 2, -1, 3])]);
  const R = fx.R ?? r.pick([1, 2, 3, -1, -2, 4]);
  const N = trim(polyAdd(polyMul(Qc, [1, -rr]), [R]));
  const Np = M.poly(N), Qp = M.poly(Qc), lin = linTex(rr);
  const quotTerms = Qc.length === 3
    ? [T(Q(Qc[0], 3), [pc.X(3)], 'over'), T(Q(Qc[1], 2), [pc.X(2)], 'over'), T(Qc[2], [pc.X(1)])]
    : [T(Q(Qc[0], 2), [pc.X(2)], 'over'), T(Qc[1], [pc.X(1)])];
  const quot = S(quotTerms);
  const logT = T(R, [lnLin(rr)]);
  const ans = S(quotTerms.concat([logT]));
  const remTex = (v) => `${v < 0 ? '-' : '+'} \\frac{${Math.abs(v)}}{${lin}}`;
  const divRes = `${Qp.tex} ${remTex(R)}`;
  const wrongQ = M.poly(Qc.slice(0, -1).concat([Qc[Qc.length - 1] + 1]));
  const domain = [rr + 0.35, rr + 3.4], absDomain = [rr - 3, rr - 0.4];
  const noPow = Qc.length === 3 ? S([T(Qc[0], [pc.X(3)]), T(Qc[1], [pc.X(2)]), T(Qc[2], [pc.X(1)])]) : S([T(Qc[0], [pc.X(2)]), T(Qc[1], [pc.X(1)])]);
  const zeros = N.some((c) => c === 0);
  return {
    family: 'divide_lin', famLabel: 'divide first (linear bottom)', level: cubic ? 2 : 1,
    tex: `\\int \\frac{${Np.tex}}{${lin}}\\,dx`, f: (x) => polyVal(N, x) / (x - rr), domain, absDomain, answer: ans,
    mistakes: [
      mk(quot, 'pf-division', `The remainder piece $${remTex(R).replace(/^\+ /, '')}$ still has to be integrated: it gives $${S([logT]).tex}$.`, 3),
      mk(S([logT]), 'pf-skip', 'You skipped the quotient. After dividing, integrate the polynomial part too.', 1),
      mk(S(quotTerms.concat([T(-R, [lnLin(rr)])])), 'sign', 'Remainder sign: it is top minus (quotient × bottom).', 1),
      mk(S(noPow.terms.concat([logT])), 'power', 'Power rule: add 1 to the power, then DIVIDE by the new power.', 2),
    ],
    hints: [`Top degree ${N.length - 1} ≥ bottom degree 1: long division first.`, `$\\frac{${Np.tex}}{${lin}} = ${divRes}$.`, 'Integrate the polynomial with the power rule and the remainder piece as a log.'],
    steps: [
      { title: 'Degree check', think: 'Compare the highest powers. Top degree ≥ bottom degree: improper, so divide first.', lines: [`\\deg(\\text{top}) = ${N.length - 1} \\ge \\deg(\\text{bottom}) = 1 \\Rightarrow \\text{divide first}`], check: proper(N.length - 1, 1), tag: 'pf-division' },
      { title: 'Long division first', think: `Write every power (use 0 for a missing one), then divide by $${lin}$. Check: quotient × bottom + remainder = top.`, lines: (zeros ? [`\\text{Top with every power: } ${fullPoly(N)}`] : []).concat([`\\text{Quotient} = ${Qp.tex}, \\qquad \\text{Remainder} = ${R}`, `\\text{Check: } (${Qp.tex})(${lin}) ${R < 0 ? '-' : '+'} ${Math.abs(R)} = ${Np.tex}`, `\\frac{${Np.tex}}{${lin}} = ${divRes}`]), check: st.choice('The division gives:', [{ tex: divRes, ok: true }, { tex: `${wrongQ.tex} ${remTex(R)}`, msg: 'Multiply the quotient back by the bottom: it does not give the top.' }, { tex: `${Qp.tex} ${remTex(-R)}`, msg: 'Remainder sign: top minus (quotient × bottom).' }], 3), tag: 'pf-division' },
      { title: 'Integrate the quotient', think: 'Power rule on each term: add 1 to the power, divide by the new power.', lines: [`\\int \\left(${Qp.tex}\\right)dx = ${quot.tex}`], check: st.expr(`\\int \\left(${Qp.tex}\\right)dx =`, { expect: quot.f, exact: false, domain, mistakes: [{ f: noPow.f, msg: 'Divide by the new power.', tag: 'power' }], points: 3, answerTex: quot.tex }), tag: 'power' },
      { title: 'Integrate the remainder piece', think: `$\\int\\frac{c}{x - r}dx = c\\ln|x - r|$. Keep the absolute value bars.`, lines: [`\\int ${remTex(R).replace(/^\+ /, '')}\\,dx = ${S([logT]).tex}`], check: st.expr(`\\int ${remTex(R).replace(/^\+ /, '')}\\,dx =`, { expect: logT.f, exact: false, domain, mistakes: R === 1 ? [] : [{ f: (x) => Math.log(Math.abs(x - rr)), msg: `Keep the ${R} in front.`, tag: 'constants' }], points: 2, answerTex: S([logT]).tex }), tag: 'abs' },
      { title: 'Add them + C', think: 'Quotient part plus the log, then $+C$.', lines: [`\\int \\frac{${Np.tex}}{${lin}}\\,dx = ${ans.tex} + C`], check: st.final(3), tag: 'pf-division' },
    ],
  };
}

/* ---------- Case 4: repeated irreducible quadratic (class Example 5) ---------- */
function rep_quad(level, r, fx = {}) {
  const k = fx.k ?? r.pick([1, 1, 2]);
  const k2 = k * k, k4 = k2 * k2;
  const A = fx.A ?? r.pick([1, 2, 1]);
  const B = fx.B ?? r.pick([0, 1, -1, 0]);
  const C = fx.C ?? r.pick([0, 0, 1, -1]);
  const D = fx.D ?? r.pick([-2, 2, -1, 1, 4, -4]);
  const E = 0;
  const full = [A + B, C, 2 * A * k2 + B * k2 + D, C * k2 + E, A * k4];
  const N = trim(full);
  const Np = M.poly(N);
  const q = `x^{2}+${k2}`;
  const quad = M.poly([1, 0, k2]);
  const LnQ = pc.Ln(quad, false);
  const At = pc.Arc('arctan', k === 1 ? M.P('x', 'x', (x) => x) : M.P(`\\frac{x}{${k}}`, `x/${k}`, (x) => x / k));
  const cD = Q(-D, 2);
  const dPiece = (sgn, half = true) => {
    const c = half ? cD : Q(-D);
    const n = Math.abs(c.n), d = c.d;
    return T(Math.sign(c.n) * sgn, [pc.Raw(`\\frac{${n}}{${d === 1 ? q : `${d}(${q})`}}`, `${n}/(${d}*(x^2+${k2}))`, (x) => n / (d * (x * x + k2)))]);
  };
  const base = [T(A, [lnLin(0)]), B ? T(Q(B, 2), [LnQ]) : null, C ? T(Q(C, k), [At]) : null].filter(Boolean);
  const ans = S(base.concat([dPiece(1)]));
  const tmpl = `\\frac{A}{x} + \\frac{Bx + C}{${q}} + \\frac{Dx + E}{(${q})^{2}}`;
  const co = (n, v) => (n === 1 ? v : `${n}${v}`);
  const grouped = `(A + B)x^{4} + Cx^{3} + (${co(2 * k2, 'A')} + ${co(k2, 'B')} + D)x^{2} + (${co(k2, 'C')} + E)x + ${co(k4, 'A')}`;
  const pieceLines = [`\\int\\frac{${A}}{x}dx = ${S([T(A, [lnLin(0)])]).tex}`];
  if (B) pieceLines.push(`\\int\\frac{${B === 1 ? '' : B === -1 ? '-' : B}x}{${q}}dx = ${S([T(Q(B, 2), [LnQ])]).tex}`);
  if (C) pieceLines.push(`\\int\\frac{${C}}{${q}}dx = ${S([T(Q(C, k), [At])]).tex}`);
  pieceLines.push(`\\int\\frac{${D === 1 ? '' : D === -1 ? '-' : D}x}{(${q})^{2}}dx = ${S([dPiece(1)]).tex}`);
  return {
    family: 'rep_quad', famLabel: 'repeated quadratic (Case 4)', level: 3,
    tex: `\\int \\frac{${Np.tex}}{x(${q})^{2}}\\,dx`, f: (x) => polyVal(N, x) / (x * (x * x + k2) ** 2), domain: [0.4, 3], absDomain: [-3, -0.4], answer: ans,
    mistakes: [
      mk(S(base.concat([T(Q(D, 2), [LnQ])])), 'power', `The squared piece is not a log. With $u = ${q}$: $\\int\\frac{Dx}{u^{2}}dx = \\frac{D}{2}\\int u^{-2}du = -\\frac{D}{2u}$.`, 5),
      mk(S(base.concat([dPiece(-1)])), 'sign', 'Power rule on $u^{-2}$ gives $-u^{-1}$: there is a minus.', 5),
      mk(S(base), 'pf-setup', `A repeated quadratic gets a fraction for EACH power, so there is a $\\frac{Dx + E}{(${q})^{2}}$ piece.`, 1),
      mk(S(base.concat([dPiece(1, false)])), 'kfactor', 'u-sub: $du = 2x\\,dx$, so a $\\frac{1}{2}$ appears.', 5),
    ],
    hints: [`Repeated irreducible quadratic: one fraction over $${q}$ and one over $(${q})^{2}$, both with linear tops.`, 'Plug in $x = 0$ for A. Then match coefficients for B, C, D, E.', `$\\int\\frac{Dx}{(${q})^{2}}dx = -\\frac{D}{2(${q})}$ (u-sub).`],
    steps: [
      { title: 'Degree check', think: 'Compare the highest powers: the bottom has degree 5.', lines: [`\\deg(\\text{top}) = ${N.length - 1} < \\deg(\\text{bottom}) = 5`], check: proper(N.length - 1, 5), tag: 'pf-division' },
      { title: 'Set up the template', think: `$${q}$ never hits 0, so it is irreducible, and it is SQUARED: one fraction for each power, each with a linear top.`, lines: [`\\frac{${Np.tex}}{x(${q})^{2}} = ${tmpl}`, `${Np.tex} = A(${q})^{2} + (Bx + C)x(${q}) + (Dx + E)x`], check: st.choice('Which setup?', [{ tex: tmpl, ok: true }, { tex: `\\frac{A}{x} + \\frac{Bx + C}{(${q})^{2}}`, msg: `A repeated factor gets one fraction per power: $${q}$ AND $(${q})^{2}$.` }, { tex: `\\frac{A}{x} + \\frac{B}{${q}} + \\frac{C}{(${q})^{2}}`, msg: 'Over a quadratic the top is linear: $Bx + C$ and $Dx + E$.' }], 3), tag: 'pf-setup' },
      { title: 'Heaviside: x = 0 gives A', think: 'At $x = 0$ every term with an $x$ in front vanishes. Only A survives.', lines: [`x = 0:\\; ${A * k4} = A(0^{2}+${k2})^{2} = ${k4 === 1 ? '' : k4}A \\;\\Rightarrow\\; A = ${A}`], check: st.num('A =', A, { points: 2, answerTex: `${A}` }), tag: 'constants' },
      { title: 'Matching coefficients: B and C', think: 'Expand the right side and group by powers of $x$. Then match each power with the left side.', lines: [`${Np.tex} = ${grouped}`, `x^{4}:\\; ${full[0]} = A + B = ${A} + B \\;\\Rightarrow\\; B = ${B}`, `x^{3}:\\; ${full[1]} = C \\;\\Rightarrow\\; C = ${C}`], check: st.num('B =', B, { points: 2, answerTex: `${B}` }), tag: 'constants' },
      { title: 'Matching coefficients: D and E', think: 'Use the $x^{2}$ and $x^{1}$ powers with the values you already have.', lines: [`x^{2}:\\; ${full[2]} = ${co(2 * k2, `(${A})`)} + ${co(k2, `(${B})`)} + D \\;\\Rightarrow\\; D = ${D}`, `x^{1}:\\; ${full[3]} = ${co(k2, `(${C})`)} + E \\;\\Rightarrow\\; E = 0`], check: st.num('D =', D, { points: 2, answerTex: `${D}` }), tag: 'constants' },
      { title: 'Integrate each piece + C', think: `Logs for $\\frac{A}{x}$ and $\\frac{Bx}{${q}}$, arctan for $\\frac{C}{${q}}$, and a u-sub ($u = ${q}$) for the squared piece.`, lines: pieceLines.concat([`= ${ans.tex} + C`]), check: st.final(3), tag: 'power' },
    ],
  };
}

/* ==========================================================================
   Solving the system: match coefficients, get one equation per power of x,
   then solve it by elimination (sys_elim) or as a chain (sys_chain).
   ========================================================================== */
/** a linear combination like A - 3B + 2C (zeros skipped) */
const lc = (terms) => {
  let out = '';
  terms.forEach(([c, v]) => {
    if (!c) return;
    const a = Math.abs(c), body = (a === 1 ? '' : a) + v;
    out += out ? (c < 0 ? ' - ' : ' + ') + body : (c < 0 ? '-' : '') + body;
  });
  return out || '0';
};
/** coefficient times a known value, fully plugged in: "-4(3)" */
const plug = (c, v, first) => {
  const a = Math.abs(c), body = `${a === 1 ? '' : a}(${v})`;
  return first ? (c < 0 ? '-' : '') + body : (c < 0 ? ' - ' : ' + ') + body;
};
const sysTex = (rows) => `\\begin{aligned} ${rows.map(([l, rhs]) => `${l} &= ${rhs}`).join(' \\\\ ')} \\end{aligned}`;

/* ---------- 2 unknowns: elimination ---------- */
function sys_elim(level, r, fx = {}) {
  let r1, r2;
  if (fx.r1 != null) { r1 = fx.r1; r2 = fx.r2; }
  else if (level === 1 || r.chance(0.4)) {
    // one factor is (x ± 1), so one add or subtract cancels A
    r2 = r.pick([-1, 1]);
    do { r1 = r.pick([-4, -3, -2, 2, 3, 4]); } while (r1 === -r2);
  } else {
    // needs a multiply first
    const R = [-4, -3, -2, 2, 3, 4];
    r1 = r.pick(R); do { r2 = r.pick(R); } while (r2 === r1 || r2 === -r1);
  }
  const AB = [-4, -3, -2, -1, 1, 2, 3, 4, 5];
  let A = fx.A, B = fx.B;
  // (the two right-hand numbers must differ, or matching them up would be a coin flip)
  if (A == null) { let t = 0; do { A = r.pick(AB); B = r.pick(AB); t++; } while ((A === B || A + B === 0 || -r2 * A - r1 * B === 0 || -r2 * A - r1 * B === A + B) && t < 50); }
  // N = A(x − r2) + B(x − r1) = (A + B)x + (−r2·A − r1·B)
  const p1 = A + B, p0 = -r2 * A - r1 * B;
  if (A === B || p1 === 0 || p0 === 0 || p0 === p1) return null;
  const N = [p1, p0];
  const Np = M.poly(N), Dp = M.poly([1, -(r1 + r2), r1 * r2]);
  const cA = -r2, cB = -r1; // the plain-number equation: cA·A + cB·B = p0
  const eq2 = lc([[cA, 'A'], [cB, 'B']]);
  const fac = `${facTex(r1)}${facTex(r2)}`;
  const tmpl = `\\frac{A}{${linTex(r1)}} + \\frac{B}{${linTex(r2)}}`;
  const ans = S([T(A, [lnLin(r1)]), T(B, [lnLin(r2)])]);
  const { domain, absDomain } = rootsDomain([r1, r2]);
  const system = sysTex([['A + B', p1], [eq2, p0]]);
  // eliminate A: (second) + r2·(first)  →  (r2 − r1)B = p0 + r2·p1
  let elimThink, elimLines;
  if (r2 === -1) {
    elimThink = 'Both equations start with $A$. Subtract the second one from the first: the $A$\'s cancel. Subtract EVERY term, numbers too.';
    elimLines = [`(A + B) - (${eq2}) = ${p1} - (${p0})`, `${lc([[1 + r1, 'B']])} = ${p1 - p0} \\;\\Rightarrow\\; B = ${B}`];
  } else if (r2 === 1) {
    elimThink = 'One equation has $+A$ and the other has $-A$. Add them: the $A$\'s cancel.';
    elimLines = [`(A + B) + (${eq2}) = ${p1} + (${p0})`, `${lc([[1 - r1, 'B']])} = ${p1 + p0} \\;\\Rightarrow\\; B = ${B}`];
  } else {
    elimThink = `The $A$'s do not match yet. Multiply the first equation by $${r2}$ so it has $${r2}A$, then add the second one: $${r2}A$ and $${-r2}A$ cancel.`;
    elimLines = [`\\text{First} \\times (${r2}):\\; ${lc([[r2, 'A'], [r2, 'B']])} = ${r2 * p1}`, `(${lc([[r2, 'A'], [r2, 'B']])}) + (${eq2}) = ${r2 * p1} + (${p0})`, `${lc([[r2 - r1, 'B']])} = ${r2 * p1 + p0} \\;\\Rightarrow\\; B = ${B}`];
  }
  // the classic slip: the right-hand number keeps the wrong sign while eliminating
  const Bs = Q(r2 * p1 - p0, r2 - r1), As = Q.sub(Q(p1), Bs);
  const mistakes = [
    mk(S([T(As, [lnLin(r1)]), T(Bs, [lnLin(r2)])]), 'sys-elim', 'Sign slip while eliminating: the number on the right side changes too. Check both answers in the equation you did not use.', 3),
    mk(S([T(B, [lnLin(r1)]), T(A, [lnLin(r2)])]), 'constants', `A and B got swapped. A sits over $${linTex(r1)}$, so in the basic equation it multiplies the OTHER factor, $${facTex(r2)}$.`, 0),
    mk(S([T(p1, [lnLin(r1)]), T(B, [lnLin(r2)])]), 'sys-chain', `Plug B back in: $A + (${B}) = ${p1}$, so $A = ${A}$.`, 4),
    mk(S([T(A, [lnLin(r1)]), T(-B, [lnLin(r2)])]), 'sign', 'Sign slip on B.', 3),
    mk(S([T(1, [pc.Ln(Dp)])]), 'pf-skip', 'You cannot $\\ln$ the whole bottom unless the top is exactly its derivative. Split it first.', 0),
  ];
  return {
    family: 'sys_elim', famLabel: 'solve the system', level: r2 === 1 || r2 === -1 ? 1 : 2,
    tex: `\\int \\frac{${Np.tex}}{${fac}}\\,dx`, f: (x) => polyVal(N, x) / ((x - r1) * (x - r2)), domain, absDomain, answer: ans, mistakes,
    hints: [`One fraction per factor: $${tmpl}$. Multiply by the whole bottom.`, `Expand and match: $A + B = ${p1}$ and $${eq2} = ${p0}$.`, r2 === -1 ? 'Subtract the equations to cancel A.' : r2 === 1 ? 'Add the equations to cancel A.' : `Multiply the first equation by ${r2}, then add.`],
    steps: [
      { title: 'Set up the template', think: 'Two different linear factors: one fraction each, a constant on top. Multiply both sides by the whole bottom to get the basic equation.', lines: [`\\frac{${Np.tex}}{${fac}} = ${tmpl}`, `${Np.tex} = A${facTex(r2)} + B${facTex(r1)}`], check: st.choice('Which setup?', [{ tex: tmpl, ok: true }, { tex: `\\frac{Ax + B}{${fac}}`, msg: 'That is the fraction you started with. Split it: one fraction per factor.' }, { tex: `\\frac{A}{${linTex(r1)}} + \\frac{B}{(${linTex(r1)})^{2}}`, msg: 'The factors are different, so each one gets its own fraction.' }], 2), tag: 'pf-setup' },
      { title: 'Expand and group by powers of x', think: 'Multiply out each piece, then collect the $x$ terms together and the plain numbers together.', lines: [`A${facTex(r2)} + B${facTex(r1)} = ${lc([[1, 'Ax'], [-r2, 'A'], [1, 'Bx'], [-r1, 'B']])}`, `= (A + B)x + (${eq2})`], check: st.choice('Grouped, it is:', [{ tex: `(A + B)x + (${eq2})`, ok: true }, { tex: `(A + B)x + (${lc([[r2, 'A'], [r1, 'B']])})`, msg: 'Watch the signs: $A(x - r)$ gives $Ax - rA$.' }, { tex: `(A + B)x + (${lc([[-r1, 'A'], [-r2, 'B']])})`, msg: `Each constant multiplies the OTHER factor: $A$ goes with $${facTex(r2)}$.` }], 2), tag: 'sys-match' },
      { title: 'Match coefficients: the system', think: 'Same power, same number on both sides: the $x$ coefficients match, and the plain numbers match. That gives one equation per power.', lines: [`${Np.tex} = (A + B)x + (${eq2})`, system], check: st.choice('So the system is:', [{ tex: system, ok: true }, { tex: sysTex([['A + B', p0], [eq2, p1]]), msg: 'Match like with like: the $x$ coefficient goes with $(A + B)$, the plain number with the other group.' }, { tex: sysTex([['A + B', p1], [eq2, -p0]]), msg: `Keep the sign of the plain number: it is $${p0}$.` }], 2), tag: 'sys-match' },
      { title: 'Eliminate A to get B', think: elimThink, lines: elimLines, check: st.num('B =', B, { points: 2, answerTex: `${B}` }), tag: 'sys-elim' },
      { title: 'Plug B back in to get A', think: 'Put the B you found into the easier equation, fully plugged in.', lines: [`A + (${B}) = ${p1} \\;\\Rightarrow\\; A = ${A}`, `\\text{Check: } ${plug(cA, A, true)}${plug(cB, B, false)} = ${p0} \\;\\checkmark`], check: st.num('A =', A, { points: 1, answerTex: `${A}` }), tag: 'sys-chain' },
      { title: 'Integrate each piece + C', think: '$\\int\\frac{A}{x - r}dx = A\\ln|x - r|$. Keep the absolute values.', lines: [`\\int \\left(\\frac{${A}}{${linTex(r1)}} + \\frac{${B}}{${linTex(r2)}}\\right)dx = ${ans.tex} + C`], check: st.final(3), tag: 'abs' },
    ],
  };
}

/* ---------- 3 unknowns: a chain (start with the one-letter equation) ---------- */
function sys_chain(level, r, fx = {}) {
  const a = fx.a ?? r.pick([1, 2, -1, -2, 1, 3]);
  const A = fx.A ?? r.pick([1, 2, -1, 3, -2]);
  const B = fx.B ?? r.pick([1, -1, 2, -2, 3]);
  const C = fx.C ?? r.pick([1, 2, 3, -1, -2, 4]);
  // N = A(x − a)² + Bx(x − a) + Cx = (A + B)x² + (−2aA − aB + C)x + a²A
  const n2 = A + B, n1 = -2 * a * A - a * B + C, n0 = a * a * A;
  if (n2 === 0) return null;
  const N = trim([n2, n1, n0]);
  const Np = M.poly(N), lin = linTex(a), a2 = a * a;
  const eq1 = lc([[-2 * a, 'A'], [-a, 'B'], [1, 'C']]);
  const eq0 = lc([[a2, 'A']]);
  const tmpl = `\\frac{A}{x} + \\frac{B}{${lin}} + \\frac{C}{(${lin})^{2}}`;
  const cPiece = C < 0 ? T(1, [fracPiece(-C, a)]) : T(-1, [fracPiece(C, a)]);
  const cWrong = C < 0 ? T(-1, [fracPiece(-C, a)]) : T(1, [fracPiece(C, a)]);
  const ans = S([T(A, [lnLin(0)]), T(B, [lnLin(a)]), cPiece]);
  const { domain, absDomain } = rootsDomain([0, a]);
  const grouped = `(A + B)x^{2} + (${eq1})x + ${eq0}`;
  const system = sysTex([['A + B', n2], [eq1, n1], [eq0, n0]]);
  const lnC = (c) => (c < 0 ? T(1, [fracPiece(-c, a)]) : T(-1, [fracPiece(c, a)]));
  const Cskip = C - 2 * a * A; // forgot the −2aA term
  const mistakes = [
    B + C !== 0 ? mk(S([T(A, [lnLin(0)]), T(B + C, [lnLin(a)])]), 'power', '$\\frac{C}{(x-a)^2}$ is not a log. Power rule: $\\int C(x-a)^{-2}dx = -\\frac{C}{x - a}$.', 6) : null,
    mk(S([T(A, [lnLin(0)]), T(B, [lnLin(a)]), cWrong]), 'sign', '$\\int (x-a)^{-2}dx = -(x-a)^{-1}$: there is a minus.', 6),
    Cskip !== C && Cskip !== 0 ? mk(S([T(A, [lnLin(0)]), T(B, [lnLin(a)]), lnC(Cskip)]), 'sys-chain', `In the $x$ equation, plug in BOTH values you know: $${plug(-2 * a, A, true)}${plug(-a, B, false)} + C = ${n1}$.`, 5) : null,
    Math.abs(a) !== 1 ? (() => { const A2 = a * A, B2 = n2 - A2, C2 = n1 + 2 * a * A2 + a * B2; return C2 !== 0 ? mk(S([T(A2, [lnLin(0)]), T(B2, [lnLin(a)]), lnC(C2)]), 'sys-chain', `The number equation is $${a2}A = ${n0}$: divide by $${a2}$.`, 3) : null; })() : null,
    mk(S([T(A, [lnLin(0)]), T(B, [lnLin(a)])]), 'pf-setup', 'A repeated factor gets one fraction for EACH power, so there is a $\\frac{C}{(x-a)^2}$ piece too.', 0),
  ];
  const fill = (c, v, first) => plug(c, v, first);
  return {
    family: 'sys_chain', famLabel: 'solve the system (chain)', level: 2,
    tex: `\\int \\frac{${Np.tex}}{x(${lin})^{2}}\\,dx`, f: (x) => polyVal(N, x) / (x * (x - a) ** 2), domain, absDomain, answer: ans, mistakes,
    hints: [`Template: $${tmpl}$.`, 'Expand, group by powers of $x$, and match. One equation will have only $A$.', 'Solve the one-letter equation first, then plug in down the chain.'],
    steps: [
      { title: 'Set up the template', think: 'A plain $x$, plus a squared linear factor: one fraction for $x$, and one for EACH power of the repeated factor.', lines: [`\\frac{${Np.tex}}{x(${lin})^{2}} = ${tmpl}`, `${Np.tex} = A(${lin})^{2} + Bx(${lin}) + Cx`], check: st.choice('Which setup?', [{ tex: tmpl, ok: true }, { tex: `\\frac{A}{x} + \\frac{B}{(${lin})^{2}}`, msg: 'A repeated factor needs a fraction for EACH power: $(x-a)$ and $(x-a)^2$.' }, { tex: `\\frac{A}{x} + \\frac{Bx + C}{(${lin})^{2}}`, msg: 'Linear factors get constant tops. It is the power that repeats, so split it into two fractions.' }], 2), tag: 'pf-setup' },
      { title: 'Expand and group by powers of x', think: `$(${lin})^2 = x^2 ${-2 * a < 0 ? '-' : '+'} ${Math.abs(2 * a)}x + ${a2}$. Multiply out each piece, then collect $x^2$ terms, $x$ terms, and plain numbers.`, lines: [`A(${lin})^{2} + Bx(${lin}) + Cx`, `= ${lc([[1, 'Ax^{2}'], [-2 * a, 'Ax'], [a2, 'A'], [1, 'Bx^{2}'], [-a, 'Bx'], [1, 'Cx']])}`, `= ${grouped}`], check: st.choice('Grouped, it is:', [{ tex: grouped, ok: true }, { tex: `(A + B)x^{2} + (${lc([[-a, 'A'], [-a, 'B'], [1, 'C']])})x + ${eq0}`, msg: `$(${lin})^2$ has a middle term with a 2: $${-2 * a}x$.` }, { tex: `(A + B)x^{2} + (${lc([[-2 * a, 'A'], [-a, 'B']])})x + ${eq0}`, msg: 'Do not lose the $Cx$ term: it goes in the $x$ group.' }], 2), tag: 'sys-match' },
      { title: 'Match coefficients: the system', think: 'Match each power of $x$ on both sides. A power missing on the left has coefficient 0.', lines: [`${Np.tex} = ${grouped}`, system], check: st.choice('So the system is:', [{ tex: system, ok: true }, { tex: sysTex([['A + B', n0], [eq1, n1], [eq0, n2]]), msg: 'Line up the powers: $x^2$ with $x^2$, plain numbers with plain numbers.' }, { tex: sysTex([['A + B', n2], [eq1, -n1 || 1], [eq0, n0]]), msg: `The $x$ coefficient on the left is $${n1}$.` }].filter((o, i, arr) => arr.findIndex((p) => p.tex === o.tex) === i), 2), tag: 'sys-match' },
      { title: 'Start with the one-letter equation', think: a2 === 1 ? 'The plain-number equation has only $A$ in it, so it already tells you A.' : 'One equation has only $A$ in it. Solve that first.', lines: [a2 === 1 ? `A = ${n0}` : `${eq0} = ${n0} \\;\\Rightarrow\\; A = ${A}`], check: st.num('A =', A, { points: 1, answerTex: `${A}` }), tag: 'sys-chain' },
      { title: 'Plug A in to get B', think: 'Put A into the $x^2$ equation, fully plugged in.', lines: [`(${A}) + B = ${n2} \\;\\Rightarrow\\; B = ${B}`], check: st.num('B =', B, { points: 1, answerTex: `${B}` }), tag: 'sys-chain' },
      { title: 'Plug A and B in to get C', think: 'Now the $x$ equation has only one unknown left. Plug in BOTH values you know.', lines: [`${fill(-2 * a, A, true)}${fill(-a, B, false)} + C = ${n1}`, `${-2 * a * A - a * B} + C = ${n1} \\;\\Rightarrow\\; C = ${C}`], check: st.num('C =', C, { points: 2, answerTex: `${C}` }), tag: 'sys-chain' },
      { title: 'Integrate each piece + C', think: 'Logs for $\\frac{A}{x}$ and $\\frac{B}{x - a}$. The squared piece uses the power rule: $\\int\\frac{C}{(x-a)^2}dx = -\\frac{C}{x - a}$.', lines: [`= ${ans.tex} + C`], check: st.final(3), tag: 'power' },
    ],
  };
}

const FAM = { distinct2, distinct3, repeated, irreducible, improper, split, divide_lin, rep_quad, sys_elim, sys_chain };
M.PF_FAMILIES = FAM;
const BY_LEVEL = {
  1: [[distinct2, 5], [split, 2], [repeated, 2], [divide_lin, 2], [sys_elim, 2]],
  2: [[distinct2, 2], [distinct3, 3], [repeated, 3], [improper, 2], [divide_lin, 1], [sys_elim, 2], [sys_chain, 2]],
  3: [[irreducible, 4], [improper, 3], [repeated, 2], [distinct3, 1], [rep_quad, 3], [sys_chain, 2], [sys_elim, 1]],
};
M.GEN.pf = function (level, r, family) {
  const fam = family ? FAM[family] : r.pickW(BY_LEVEL[level] || BY_LEVEL[1]);
  const p = fam(level, r);
  if (p) p.level = level;
  return p;
};
})(typeof globalThis !== 'undefined' ? globalThis : this);
