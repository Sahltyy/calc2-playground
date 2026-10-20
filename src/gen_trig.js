/* ==========================================================================
   UNIT 2 — Trigonometric Integrals
   ========================================================================== */
(function (G) {
'use strict';
const M = G.M, Q = M.Q, T = M.term, S = M.sum, pc = M.pc, st = M.st;
const mk = M.mistake;
const B = M.binom;

const trigPow = (name, p) => (p === 0 ? '' : p === 1 ? `\\${name} x` : `\\${name}^{${p}} x`);
const prodTex = (...parts) => parts.filter(Boolean).join('\\,');
const uPoly = (pairs) => S(pairs.map(([c, p]) => T(c, p === 0 ? [] : [pc.X(p, 'u')]))); // Σ c u^p
const uAnti = (pairs, style = 'over') => S(pairs.map(([c, p]) => T(Q.div(c, Q(p + 1)), [pc.X(p + 1, 'u')], style)));
const trigSum = (pairs, name) => S(pairs.map(([c, p]) => T(c, [pc.Trig(name, 1, p)], 'over')));
const powerTrap = 'You cannot use the power rule on a trig function: $\\sin x$ is not $x$. You need an identity and a u-sub.';

const STRAT = {
  saveSin: { key: 'saveSin', tex: null, text: 'Odd power of $\\sin$: save one $\\sin x$, convert the rest to $\\cos$ with $\\sin^2 = 1-\\cos^2$, let $u = \\cos x$' },
  saveCos: { key: 'saveCos', text: 'Odd power of $\\cos$: save one $\\cos x$, convert the rest to $\\sin$ with $\\cos^2 = 1-\\sin^2$, let $u = \\sin x$' },
  half: { key: 'half', text: 'All powers even: use the half-angle identities to lower the powers' },
  saveSec2: { key: 'saveSec2', text: 'Even power of $\\sec$: save $\\sec^2 x$, convert the rest with $\\sec^2 = 1+\\tan^2$, let $u = \\tan x$' },
  saveSecTan: { key: 'saveSecTan', text: 'Odd power of $\\tan$: save $\\sec x\\tan x$, convert the rest with $\\tan^2 = \\sec^2-1$, let $u = \\sec x$' },
};
function strategyChoice(correct, why) {
  const order = ['saveSin', 'saveCos', 'half', 'saveSec2', 'saveSecTan'];
  const isTanSec = correct === 'saveSec2' || correct === 'saveSecTan';
  const pool = order.filter((k) => (isTanSec ? ['saveSec2', 'saveSecTan', 'half'].includes(k) : ['saveSin', 'saveCos', 'half', 'saveSec2'].includes(k)));
  return st.choice('Which strategy fits?', pool.map((k) => (k === correct ? { text: STRAT[k].text, ok: true } : { text: STRAT[k].text, msg: why[k] || 'That route does not fit these powers. Look at which power is odd.' })), 2);
}

/* ---------- sin odd ---------- */
function sin_odd(level, r, fx = {}) {
  const m = fx.m ?? r.pick([3, 3, 5]);
  const n = fx.n ?? (m === 5 ? r.pick([0, 2]) : r.pick([0, 2, 4, 2]));
  const k = (m - 1) / 2;
  const integrandTex = prodTex(trigPow('sin', m), trigPow('cos', n));
  const f = (x) => Math.sin(x) ** m * Math.cos(x) ** n;
  // u-integrand: -(1-u^2)^k u^n = Σ -C(k,j)(-1)^j u^{n+2j}
  const pairs = []; for (let j = 0; j <= k; j++) pairs.push([Q(B(k, j) * (j % 2 ? -1 : 1)), n + 2 * j]);
  const negPairs = pairs.map(([c, p]) => [Q.neg(c), p]);
  const polyU = uPoly(pairs);
  const Gu = uAnti(negPairs);
  const ans = trigSum(negPairs.map(([c, p]) => [Q.div(c, Q(p + 1)), p + 1]), 'cos');
  const domain = [-1.3, 1.4];
  const identPairs = []; for (let j = 0; j <= k; j++) identPairs.push([Q(-B(k, j)), n + 2 * j]);
  const mistakes = [
    mk(M.sumNeg(ans), 'trig-sign', 'You lost the minus from $du = -\\sin x\\,dx$. With $u = \\cos x$, the saved $\\sin x\\,dx$ becomes $-du$.', 2),
    mk(trigSum(identPairs.map(([c, p]) => [Q.div(c, Q(p + 1)), p + 1]), 'cos'), 'identity', 'Identity sign: $\\sin^2 x = 1 - \\cos^2 x$ (minus).', 1),
    mk(trigSum(negPairs.map(([c, p]) => [c, p + 1]), 'cos'), 'power', 'Reverse power rule: after adding 1 to each power, divide by the new power.', 3),
    n === 0
      ? mk(S([T(Q(1, m + 1), [pc.Trig('sin', 1, m + 1)], 'over')]), 'power', powerTrap, null)
      : mk(S([T(Q(-1, (m + 1) * (n + 1)), [pc.Trig('sin', 1, m + 1), pc.Trig('cos', 1, n + 1)])]), 'power', powerTrap, null),
  ];
  const restLine = `\\int ${integrandTex}\\,dx = \\int (\\sin^{2} x)^{${k}}${n ? trigPow('cos', n) : ''}\\,\\sin x\\,dx = \\int (1-\\cos^{2} x)^{${k}}${n ? trigPow('cos', n) : ''}\\,\\sin x\\,dx`;
  const subLine = `= \\int (1-u^{2})^{${k}}${n ? `u^{${n}}` : ''}\\,(-du) = -\\int \\left(${polyU.tex}\\right)du`;
  return {
    family: 'sin_odd', famLabel: 'sinᵐ (odd) · cosⁿ', level: m === 5 || n === 4 ? 2 : 1,
    tex: `\\int ${integrandTex}\\,dx`, f, domain, answer: ans, mistakes,
    hints: [
      `The power of $\\sin$ is ${m} (odd). Save one $\\sin x$ for $du$.`,
      `Convert the other $\\sin^{${m - 1}} x$ using $\\sin^2 x = 1 - \\cos^2 x$, then $u = \\cos x$.`,
      '$du = -\\sin x\\,dx$, so the saved $\\sin x\\,dx$ is $-du$.',
    ],
    steps: [
      { title: 'Spot the odd power', think: `Look at the exponents: $\\sin$ has ${m} (odd)${n ? `, $\\cos$ has ${n} (even)` : ''}. An odd power means you can save one copy for $du$.`, lines: [restLine.split(' = ')[0] + ' = \\dots'], check: strategyChoice('saveSin', { saveCos: `$\\cos$ has an even power (${n}) here, so there is no extra $\\cos$ to save.`, half: `Half-angle is for when all powers are even. $\\sin$ has power ${m}.`, saveSec2: 'There is no $\\sec$ or $\\tan$ in this one.' }), tag: 'strategy' },
      { title: 'Convert with an identity', think: 'Write $\\sin^{' + (m - 1) + '} x = (\\sin^2 x)^{' + k + '}$, then use the Pythagorean identity so everything except the saved $\\sin x$ is in $\\cos$.', lines: [restLine], check: st.choice('$\\sin^2 x = \\;?$', [{ tex: '1 - \\cos^{2} x', ok: true }, { tex: '\\cos^{2} x - 1', msg: '$\\sin^2 + \\cos^2 = 1$, so $\\sin^2 = 1 - \\cos^2$.' }, { tex: '1 + \\cos^{2} x', msg: 'Sign: $\\sin^2 = 1 - \\cos^2$.' }], 2), tag: 'identity' },
      { title: 'Substitute u = cos x', think: 'Differentiate $u = \\cos x$. This is where the sign trap lives.', lines: ['u = \\cos x \\;\\Rightarrow\\; du = -\\sin x\\,dx'], check: st.expr('du =', { suffixTex: '\\,dx', expect: (x) => -Math.sin(x), exact: true, domain, mistakes: [{ f: Math.sin, msg: 'The derivative of $\\cos x$ is $-\\sin x$. Keep that minus.', tag: 'trig-sign' }, { f: (x) => -Math.cos(x), msg: 'Differentiate $\\cos x$: you get $-\\sin x$.', tag: 'derivative' }], points: 2, answerTex: '-\\sin x' }), tag: 'trig-sign' },
      { title: 'Integrate in u', think: 'Plug in fully: $(1-u^2)^{' + k + '}' + (n ? `u^{${n}}` : '') + '$ and $-du$. Expand, then power-rule each term (add 1, divide).', lines: [subLine, `= ${Gu.tex} + C`], check: st.expr(`-\\int \\left(${polyU.tex}\\right)du =`, { vars: ['u'], expect: Gu.f, exact: false, domain: [0.15, 0.95], mistakes: [{ f: (u) => -Gu.f(u), msg: 'You dropped the minus that came from $du = -\\sin x\\,dx$.', tag: 'trig-sign' }], points: 3, answerTex: Gu.tex }), tag: 'power' },
      { title: 'Back to x, then + C', think: 'Replace every $u$ with $\\cos x$. Then $+C$.', lines: [`\\int ${integrandTex}\\,dx = ${ans.tex} + C`], check: st.final(3), tag: 'backsub' },
    ],
  };
}

/* ---------- cos odd ---------- */
function cos_odd(level, r, fx = {}) {
  const n = fx.n ?? r.pick([3, 3, 5]);
  const m = fx.m ?? (n === 5 ? r.pick([0, 2]) : r.pick([0, 2, 4, 2]));
  const k = (n - 1) / 2;
  const integrandTex = prodTex(trigPow('sin', m), trigPow('cos', n));
  const f = (x) => Math.sin(x) ** m * Math.cos(x) ** n;
  const pairs = []; for (let j = 0; j <= k; j++) pairs.push([Q(B(k, j) * (j % 2 ? -1 : 1)), m + 2 * j]);
  const polyU = uPoly(pairs);
  const Gu = uAnti(pairs);
  const ans = trigSum(pairs.map(([c, p]) => [Q.div(c, Q(p + 1)), p + 1]), 'sin');
  const domain = [-1.3, 1.4];
  const identPairs = []; for (let j = 0; j <= k; j++) identPairs.push([Q(B(k, j)), m + 2 * j]);
  const mistakes = [
    mk(M.sumNeg(ans), 'trig-sign', 'With $u = \\sin x$, $du = +\\cos x\\,dx$. No minus sign here.', 2),
    mk(trigSum(identPairs.map(([c, p]) => [Q.div(c, Q(p + 1)), p + 1]), 'sin'), 'identity', 'Identity sign: $\\cos^2 x = 1 - \\sin^2 x$ (minus).', 1),
    mk(trigSum(pairs.map(([c, p]) => [c, p + 1]), 'sin'), 'power', 'Reverse power rule: add 1 to the power, then divide by the new power.', 3),
    m === 0
      ? mk(S([T(Q(1, n + 1), [pc.Trig('cos', 1, n + 1)], 'over')]), 'power', powerTrap, null)
      : mk(S([T(Q(1, (m + 1) * (n + 1)), [pc.Trig('sin', 1, m + 1), pc.Trig('cos', 1, n + 1)])]), 'power', powerTrap, null),
  ];
  const restLine = `\\int ${integrandTex}\\,dx = \\int ${m ? trigPow('sin', m) : ''}(\\cos^{2} x)^{${k}}\\,\\cos x\\,dx = \\int ${m ? trigPow('sin', m) : ''}(1-\\sin^{2} x)^{${k}}\\,\\cos x\\,dx`;
  const subLine = `= \\int ${m ? `u^{${m}}` : ''}(1-u^{2})^{${k}}\\,du = \\int \\left(${polyU.tex}\\right)du`;
  return {
    family: 'cos_odd', famLabel: 'sinᵐ · cosⁿ (odd)', level: n === 5 || m === 4 ? 2 : 1,
    tex: `\\int ${integrandTex}\\,dx`, f, domain, answer: ans, mistakes,
    hints: [
      `The power of $\\cos$ is ${n} (odd). Save one $\\cos x$ for $du$.`,
      `Convert the other $\\cos^{${n - 1}} x$ with $\\cos^2 x = 1 - \\sin^2 x$, then $u = \\sin x$.`,
      '$du = \\cos x\\,dx$: the saved $\\cos x\\,dx$ is exactly $du$.',
    ],
    steps: [
      { title: 'Spot the odd power', think: `$\\cos$ has power ${n} (odd)${m ? `, $\\sin$ has ${m} (even)` : ''}. Save one $\\cos x$.`, lines: [`\\int ${integrandTex}\\,dx`], check: strategyChoice('saveCos', { saveSin: `$\\sin$ has an even power (${m}) here.`, half: `Half-angle is for all-even powers. $\\cos$ has power ${n}.`, saveSec2: 'No $\\sec$ or $\\tan$ here.' }), tag: 'strategy' },
      { title: 'Convert with an identity', think: `Write $\\cos^{${n - 1}} x = (\\cos^2 x)^{${k}}$ and switch it to $\\sin$.`, lines: [restLine], check: st.choice('$\\cos^2 x = \\;?$', [{ tex: '1 - \\sin^{2} x', ok: true }, { tex: '\\sin^{2} x - 1', msg: '$\\sin^2 + \\cos^2 = 1$, so $\\cos^2 = 1 - \\sin^2$.' }, { tex: '1 + \\sin^{2} x', msg: 'Sign: $\\cos^2 = 1 - \\sin^2$.' }], 2), tag: 'identity' },
      { title: 'Substitute u = sin x', think: 'Differentiate $u = \\sin x$.', lines: ['u = \\sin x \\;\\Rightarrow\\; du = \\cos x\\,dx'], check: st.expr('du =', { suffixTex: '\\,dx', expect: Math.cos, exact: true, domain, mistakes: [{ f: (x) => -Math.cos(x), msg: 'The derivative of $\\sin x$ is $+\\cos x$.', tag: 'trig-sign' }], points: 2, answerTex: '\\cos x' }), tag: 'trig-sign' },
      { title: 'Integrate in u', think: 'Expand, then add 1 to each power and divide by it.', lines: [subLine, `= ${Gu.tex} + C`], check: st.expr(`\\int \\left(${polyU.tex}\\right)du =`, { vars: ['u'], expect: Gu.f, exact: false, domain: [0.15, 0.95], mistakes: [{ f: (u) => -Gu.f(u), msg: 'Sign check: there is no minus from $du$ this time.', tag: 'trig-sign' }], points: 3, answerTex: Gu.tex }), tag: 'power' },
      { title: 'Back to x, then + C', think: 'Every $u$ becomes $\\sin x$.', lines: [`\\int ${integrandTex}\\,dx = ${ans.tex} + C`], check: st.final(3), tag: 'backsub' },
    ],
  };
}

/* ---------- even powers: half-angle ---------- */
function even(level, r, fx = {}) {
  const kind = fx.kind ?? (level === 1 ? r.pick(['sin2', 'cos2']) : r.pick(['sin2', 'cos2', 'sin2cos2', 'sin4', 'cos4', 'sin2cos2', 'sin4', 'cos4']));
  if (kind === 'sin2' || kind === 'cos2') return evenSquare(level, r, kind === 'sin2' ? 'sin' : 'cos', fx.a);
  if (kind === 'sin2cos2') return evenSinCos(level, r);
  return evenFourth(level, r, kind === 'sin4' ? 'sin' : 'cos');
}
function evenSquare(level, r, fn, aFix) {
  const a = aFix ?? r.pick([1, 1, 2, 3]);
  const s = fn === 'sin' ? -1 : 1;
  const X = pc.X(1);
  const S2 = pc.Trig('sin', 2 * a);
  const ans = S([T(Q(1, 2), [X], 'over'), T(Q(s, 4 * a), [S2], 'over')]);
  const domain = [-1.5, 1.6];
  const arg = M.axTex(a), arg2 = M.axTex(2 * a);
  const integrandTex = a === 1 ? `\\${fn}^{2} x` : `\\${fn}^{2}(${arg})`;
  const idTex = `\\frac{1 ${s < 0 ? '-' : '+'} \\cos(${arg2})}{2}`;
  const mistakes = [
    mk(S([T(Q(1, 2), [X], 'over'), T(Q(-s, 4 * a), [S2], 'over')]), 'identity', fn === 'sin' ? 'That is the $\\cos^2$ identity. For $\\sin^2$ it is $\\frac{1 - \\cos 2\\theta}{2}$ (minus).' : 'That is the $\\sin^2$ identity. For $\\cos^2$ it is $\\frac{1 + \\cos 2\\theta}{2}$ (plus).', 1),
    mk(S([T(Q(1, 2), [X], 'over'), T(Q(s, 2), [S2], 'over')]), 'kfactor', `$\\int\\cos(${arg2})\\,dx = \\frac{1}{${2 * a}}\\sin(${arg2})$. Divide by the number next to $x$.`, 2),
    mk(S([T(1, [X]), T(Q(s, 2 * a), [S2], 'over')]), 'identity', 'The half-angle identity has a $\\frac{1}{2}$ in front of everything, including the 1.', 1),
    mk(S([T(Q(1, 3 * a), [pc.Trig(fn, a, 3)], 'over')]), 'power', powerTrap, null),
  ];
  return {
    family: 'even', famLabel: `${fn}²(ax)`, level: 1,
    tex: `\\int ${integrandTex}\\,dx`, f: (x) => M.TRIGF[fn](a * x) ** 2, domain, answer: ans, mistakes,
    hints: [
      'Even power and nothing odd to save: half-angle identity.',
      `$\\${fn}^2\\theta = ${fn === 'sin' ? '\\frac{1-\\cos 2\\theta}{2}' : '\\frac{1+\\cos 2\\theta}{2}'}$ with $\\theta = ${arg}$.`,
      `Then integrate $\\frac{1}{2}$ and $\\cos(${arg2})$ separately.`,
    ],
    steps: [
      { title: 'Pick the strategy', think: 'There is no odd power to save (the other function has power 0, which counts as even). Even powers mean half-angle.', lines: [`\\int ${integrandTex}\\,dx`], check: strategyChoice('half', { saveSin: `The power of $\\sin$ here is ${fn === 'sin' ? 2 : 0} (even), nothing to save.`, saveCos: `The power of $\\cos$ here is ${fn === 'cos' ? 2 : 0} (even), nothing to save.`, saveSec2: 'No $\\sec$ here.' }), tag: 'strategy' },
      { title: 'Half-angle identity', think: 'Half-angle trades a square for a double angle. The sign tells you which one: minus for $\\sin^2$, plus for $\\cos^2$.', lines: [`\\${fn}^{2}(${arg}) = ${idTex}`], check: st.choice(`$\\${fn}^2\\theta = \\;?$`, [{ tex: fn === 'sin' ? '\\frac{1-\\cos 2\\theta}{2}' : '\\frac{1+\\cos 2\\theta}{2}', ok: true }, { tex: fn === 'sin' ? '\\frac{1+\\cos 2\\theta}{2}' : '\\frac{1-\\cos 2\\theta}{2}', msg: fn === 'sin' ? 'That one is $\\cos^2$. $\\sin^2$ gets the minus.' : 'That one is $\\sin^2$. $\\cos^2$ gets the plus.' }, { tex: fn === 'sin' ? '1 - \\cos^{2}\\theta' : '1-\\sin^{2}\\theta', msg: 'True, but it just swaps one square for another. Half-angle lowers the power.' }], 2), tag: 'identity' },
      { title: 'Split and integrate the cosine', think: `Pull out $\\frac{1}{2}$ and integrate each piece. For the cosine, divide by ${2 * a}.`, lines: [`\\int ${idTex}\\,dx = \\frac{1}{2}\\int 1\\,dx ${s < 0 ? '-' : '+'} \\frac{1}{2}\\int \\cos(${arg2})\\,dx`, `\\int\\cos(${arg2})\\,dx = ${S([T(Q(1, 2 * a), [S2], 'over')]).tex}`], check: st.expr(`\\int \\cos(${arg2})\\,dx =`, { expect: (x) => Math.sin(2 * a * x) / (2 * a), exact: false, domain, mistakes: [{ f: (x) => Math.sin(2 * a * x), msg: `Divide by ${2 * a}, the number next to $x$.`, tag: 'kfactor' }, { f: (x) => -Math.sin(2 * a * x) / (2 * a), msg: '$\\int\\cos = +\\sin$.', tag: 'trig-sign' }], points: 3, answerTex: S([T(Q(1, 2 * a), [S2], 'over')]).tex }), tag: 'kfactor' },
      { title: 'Put it together + C', think: 'Multiply each piece by its $\\frac{1}{2}$ and add $+C$.', lines: [`\\int ${integrandTex}\\,dx = ${ans.tex} + C`], check: st.final(5), tag: 'algebra' },
    ],
  };
}
function evenSinCos(level, r) {
  const X = pc.X(1), S4 = pc.Trig('sin', 4);
  const ans = S([T(Q(1, 8), [X], 'over'), T(Q(-1, 32), [S4], 'over')]);
  const domain = [-1.5, 1.6];
  const mistakes = [
    mk(S([T(Q(1, 8), [X], 'over'), T(Q(1, 32), [S4], 'over')]), 'identity', '$\\sin^2(2x) = \\frac{1-\\cos 4x}{2}$: minus.', 2),
    mk(S([T(Q(1, 4), [X], 'over'), T(Q(-1, 16), [S4], 'over')]), 'identity', '$\\sin x\\cos x = \\frac{1}{2}\\sin 2x$, so squaring gives $\\frac{1}{4}\\sin^2 2x$. A $\\frac12$ went missing.', 1),
    mk(S([T(Q(1, 8), [X], 'over'), T(Q(-1, 8), [S4], 'over')]), 'kfactor', '$\\int\\cos 4x\\,dx = \\frac{1}{4}\\sin 4x$: divide by 4.', 3),
    mk(S([T(Q(1, 9), [pc.Trig('sin', 1, 3), pc.Trig('cos', 1, 3)])]), 'power', powerTrap, null),
  ];
  return {
    family: 'even', famLabel: 'sin²x · cos²x', level: 2,
    tex: '\\int \\sin^{2} x\\,\\cos^{2} x\\,dx', f: (x) => (Math.sin(x) * Math.cos(x)) ** 2, domain, answer: ans, mistakes,
    hints: ['Both powers even: half-angle.', 'Shortcut: $\\sin x\\cos x = \\frac12\\sin 2x$, so the integrand is $\\frac14\\sin^2 2x$.', '$\\sin^2 2x = \\frac{1-\\cos 4x}{2}$.'],
    steps: [
      { title: 'Pick the strategy', think: 'Both powers are 2 (even). Half-angle.', lines: ['\\int \\sin^{2} x\\,\\cos^{2} x\\,dx'], check: strategyChoice('half', { saveSin: 'The power of $\\sin$ is 2 (even).', saveCos: 'The power of $\\cos$ is 2 (even).', saveSec2: 'No $\\sec$ here.' }), tag: 'strategy' },
      { title: 'Double-angle shortcut', think: '$\\sin 2x = 2\\sin x\\cos x$. Solve for $\\sin x\\cos x$.', lines: ['\\sin^{2}x\\cos^{2}x = (\\sin x\\cos x)^{2} = \\left(\\tfrac{1}{2}\\sin 2x\\right)^{2} = \\tfrac{1}{4}\\sin^{2}2x'], check: st.choice('$\\sin x\\cos x = \\;?$', [{ tex: '\\frac{1}{2}\\sin 2x', ok: true }, { tex: '\\sin 2x', msg: '$\\sin 2x = 2\\sin x\\cos x$, so you need the $\\frac12$.' }, { tex: '2\\sin 2x', msg: 'Other way around: $\\sin x \\cos x = \\frac{1}{2}\\sin 2x$.' }], 2), tag: 'identity' },
      { title: 'Half-angle again', think: 'Now lower $\\sin^2 2x$ with half-angle (angle doubles to $4x$).', lines: ['\\tfrac{1}{4}\\sin^{2}2x = \\tfrac{1}{4}\\cdot\\frac{1-\\cos 4x}{2} = \\frac{1-\\cos 4x}{8}'], check: st.expr('\\sin^{2}x\\cos^{2}x =', { expect: (x) => (1 - Math.cos(4 * x)) / 8, exact: true, domain, mistakes: [{ f: (x) => (1 + Math.cos(4 * x)) / 8, msg: '$\\sin^2$ half-angle has a minus.', tag: 'identity' }, { f: (x) => (1 - Math.cos(4 * x)) / 4, msg: 'Two $\\frac12$ factors: $\\frac14 \\cdot \\frac12 = \\frac18$.', tag: 'identity' }], points: 3, answerTex: '\\frac{1-\\cos 4x}{8}' }), tag: 'identity' },
      { title: 'Integrate + C', think: '$\\int\\frac{1}{8}dx$ and $\\int\\frac{\\cos 4x}{8}dx$ (divide by 4).', lines: [`\\int \\frac{1-\\cos 4x}{8}\\,dx = ${ans.tex} + C`], check: st.final(5), tag: 'kfactor' },
    ],
  };
}
function evenFourth(level, r, fn) {
  const s = fn === 'sin' ? -1 : 1;
  const X = pc.X(1), S2 = pc.Trig('sin', 2), S4 = pc.Trig('sin', 4);
  const ans = S([T(Q(3, 8), [X], 'over'), T(Q(s, 4), [S2], 'over'), T(Q(1, 32), [S4], 'over')]);
  const domain = [-1.5, 1.6];
  const mistakes = [
    mk(S([T(Q(3, 8), [X], 'over'), T(Q(-s, 4), [S2], 'over'), T(Q(1, 32), [S4], 'over')]), 'identity', fn === 'sin' ? '$\\sin^2 x = \\frac{1-\\cos 2x}{2}$, so the middle term is negative.' : '$\\cos^2 x = \\frac{1+\\cos 2x}{2}$, so the middle term is positive.', 1),
    mk(S([T(Q(1, 4), [X], 'over'), T(Q(s, 4), [S2], 'over')]), 'identity', 'The $\\cos^2 2x$ term needs half-angle again: $\\cos^2 2x = \\frac{1+\\cos 4x}{2}$. It adds $\\frac{1}{8}$ to the constant.', 2),
    mk(S([T(Q(3, 8), [X], 'over'), T(Q(s, 4), [S2], 'over'), T(Q(-1, 32), [S4], 'over')]), 'identity', '$\\cos^2 2x = \\frac{1+\\cos 4x}{2}$ (plus), every time.', 2),
    mk(S([T(Q(1, 5), [pc.Trig(fn, 1, 5)], 'over')]), 'power', powerTrap, null),
  ];
  return {
    family: 'even', famLabel: `${fn}⁴x`, level: 2,
    tex: `\\int \\${fn}^{4} x\\,dx`, f: (x) => M.TRIGF[fn](x) ** 4, domain, answer: ans, mistakes,
    hints: ['Even power: half-angle (twice!).', `$\\${fn}^4 x = (\\${fn}^2 x)^2 = \\left(\\frac{1 ${s < 0 ? '-' : '+'} \\cos 2x}{2}\\right)^2$.`, 'Expanding gives a $\\cos^2 2x$, which needs half-angle again.'],
    steps: [
      { title: 'Pick the strategy', think: 'Power 4 is even and there is nothing else to save. Half-angle.', lines: [`\\int \\${fn}^{4} x\\,dx`], check: strategyChoice('half', { saveSin: 'Power 4 is even.', saveCos: 'Power 4 is even.', saveSec2: 'No $\\sec$ here.' }), tag: 'strategy' },
      { title: 'Square the half-angle', think: 'Write it as a square of a square, then expand like $(a+b)^2$.', lines: [`\\${fn}^{4}x = \\left(\\frac{1 ${s < 0 ? '-' : '+'} \\cos 2x}{2}\\right)^{2} = \\frac{1 ${s < 0 ? '-' : '+'} 2\\cos 2x + \\cos^{2}2x}{4}`], check: st.choice('$\\cos^2 2x$ is still squared. Lower it with:', [{ tex: '\\cos^{2}2x = \\frac{1+\\cos 4x}{2}', ok: true }, { tex: '\\cos^{2}2x = \\frac{1-\\cos 4x}{2}', msg: 'That is the $\\sin^2$ version. $\\cos^2$ gets the plus.' }, { tex: '\\cos^{2}2x = 1 - \\sin^{2}2x', msg: 'True, but it does not lower the power.' }], 3), tag: 'identity' },
      { title: 'Collect the constant', think: `$\\frac{1}{4} + \\frac{1}{4}\\cdot\\frac{1}{2}$. The constant terms combine into one number.`, lines: [`\\${fn}^{4}x = \\frac{3}{8} ${s < 0 ? '-' : '+'} \\frac{1}{2}\\cos 2x + \\frac{1}{8}\\cos 4x`], check: st.num('\\text{constant term} =', 3 / 8, { points: 2, answerTex: '\\frac{3}{8}' }), tag: 'algebra' },
      { title: 'Integrate + C', think: 'Integrate term by term. $\\int\\cos 2x = \\frac{1}{2}\\sin 2x$, $\\int\\cos 4x = \\frac14\\sin 4x$.', lines: [`\\int \\${fn}^{4}x\\,dx = ${ans.tex} + C`], check: st.final(5), tag: 'kfactor' },
    ],
  };
}

/* ---------- tan^m sec^n, even sec ---------- */
function tan_sec_even(level, r, fx = {}) {
  const cases = level === 1 ? [[1, 2], [2, 2], [3, 2], [0, 4]] : [[0, 4], [2, 4], [0, 6], [4, 4], [2, 2], [4, 2]];
  const [m, n] = fx.mn ?? r.pick(cases);
  const K = (n - 2) / 2;
  const integrandTex = prodTex(trigPow('tan', m), trigPow('sec', n));
  const f = (x) => Math.tan(x) ** m / Math.cos(x) ** n;
  const pairs = []; for (let j = 0; j <= K; j++) pairs.push([Q(B(K, j)), m + 2 * j]);
  const polyU = uPoly(pairs);
  const Gu = uAnti(pairs);
  const ans = trigSum(pairs.map(([c, p]) => [Q.div(c, Q(p + 1)), p + 1]), 'tan');
  const domain = [-1.2, 1.25];
  const identPairs = []; for (let j = 0; j <= K; j++) identPairs.push([Q(B(K, j) * (j % 2 ? -1 : 1)), m + 2 * j]);
  const mistakes = [
    K > 0 ? mk(trigSum(identPairs.map(([c, p]) => [Q.div(c, Q(p + 1)), p + 1]), 'tan'), 'identity', 'Identity: $\\sec^2 x = 1 + \\tan^2 x$ (plus).', 1) : null,
    mk(trigSum(pairs.map(([c, p]) => [c, p + 1]), 'tan'), 'power', 'After adding 1 to each power, divide by the new power.', 3),
    mk(m === 0 ? S([T(Q(1, n + 1), [pc.Trig('sec', 1, n + 1)], 'over')]) : S([T(Q(1, (m + 1) * (n + 1)), [pc.Trig('tan', 1, m + 1), pc.Trig('sec', 1, n + 1)])]), 'power', powerTrap, null),
    mk(M.sumNeg(ans), 'trig-sign', 'Sign check: $\\frac{d}{dx}\\tan x = +\\sec^2 x$.', 2),
  ].filter((x) => x && x.f);
  const steps = [
    { title: 'Spot the even sec', think: `$\\sec$ has power ${n} (even). Save $\\sec^2 x$ for $du$ and let $u = \\tan x$.`, lines: [`\\int ${integrandTex}\\,dx`], check: strategyChoice('saveSec2', { saveSecTan: `That needs an odd power of $\\tan$${m % 2 ? '' : ` (here it is ${m})`}.`, half: 'Half-angle is for $\\sin$/$\\cos$ powers.' }), tag: 'strategy' },
  ];
  if (K > 0) steps.push({ title: 'Convert the extra sec', think: `Keep one $\\sec^2 x$; turn the other $\\sec^{${n - 2}} x = (\\sec^2 x)^{${K}}$ into $\\tan$.`, lines: [`\\int ${m ? trigPow('tan', m) : ''}(\\sec^{2} x)^{${K}}\\,\\sec^{2}x\\,dx = \\int ${m ? trigPow('tan', m) : ''}(1+\\tan^{2}x)^{${K}}\\,\\sec^{2}x\\,dx`], check: st.choice('$\\sec^2 x = \\;?$', [{ tex: '1 + \\tan^{2} x', ok: true }, { tex: '\\tan^{2} x - 1', msg: '$\\tan^2 + 1 = \\sec^2$ (divide $\\sin^2+\\cos^2=1$ by $\\cos^2$).' }, { tex: '1 - \\tan^{2} x', msg: 'Plus, not minus: $\\sec^2 = 1 + \\tan^2$.' }], 2), tag: 'identity' });
  steps.push({ title: 'Substitute u = tan x', think: 'Differentiate $\\tan x$.', lines: ['u = \\tan x \\;\\Rightarrow\\; du = \\sec^{2} x\\,dx'], check: st.expr('du =', { suffixTex: '\\,dx', expect: (x) => 1 / Math.cos(x) ** 2, exact: true, domain, mistakes: [{ f: (x) => Math.tan(x) / Math.cos(x), msg: 'That is the derivative of $\\sec x$. For $\\tan x$ it is $\\sec^2 x$.', tag: 'derivative' }], points: K > 0 ? 2 : 3, answerTex: '\\sec^{2} x' }), tag: 'derivative' });
  steps.push({ title: 'Integrate in u', think: 'Expand and power-rule each term.', lines: [`= \\int \\left(${polyU.tex}\\right)du = ${Gu.tex} + C`], check: st.expr(`\\int \\left(${polyU.tex}\\right)du =`, { vars: ['u'], expect: Gu.f, exact: false, domain: [0.2, 1.4], mistakes: [], points: K > 0 ? 3 : 4, answerTex: Gu.tex }), tag: 'power' });
  steps.push({ title: 'Back to x, then + C', think: 'Every $u$ becomes $\\tan x$.', lines: [`\\int ${integrandTex}\\,dx = ${ans.tex} + C`], check: st.final(3), tag: 'backsub' });
  return {
    family: 'tan_sec_even', famLabel: 'tanᵐ · secⁿ (even)', level: n >= 4 ? 2 : 1,
    tex: `\\int ${integrandTex}\\,dx`, f, domain, answer: ans, mistakes,
    hints: [`$\\sec$ has an even power: save $\\sec^2 x$ for $du$.`, K > 0 ? 'Convert the remaining $\\sec^2$ factors with $\\sec^2 = 1 + \\tan^2$.' : 'Everything else is already $\\tan$.', '$u = \\tan x$, $du = \\sec^2 x\\,dx$.'],
    steps,
  };
}

/* ---------- tan odd, sec odd: save sec·tan ---------- */
function tan_odd(level, r, fx = {}) {
  const cases = level === 1 ? [[1, 1], [1, 3], [3, 1]] : [[3, 1], [3, 3], [1, 3], [5, 1], [1, 5], [3, 3]];
  const [m, n] = fx.mn ?? r.pick(cases);
  const K = (m - 1) / 2;
  const integrandTex = prodTex(trigPow('tan', m), trigPow('sec', n));
  const f = (x) => Math.tan(x) ** m / Math.cos(x) ** n;
  // (u^2-1)^K u^{n-1} = Σ C(K,j)(-1)^{K-j} u^{2j+n-1}
  const pairs = []; for (let j = 0; j <= K; j++) pairs.push([Q(B(K, j) * ((K - j) % 2 ? -1 : 1)), 2 * j + n - 1]);
  pairs.sort((a, b) => b[1] - a[1]);
  const polyU = uPoly(pairs);
  const Gu = uAnti(pairs);
  const ans = trigSum(pairs.map(([c, p]) => [Q.div(c, Q(p + 1)), p + 1]), 'sec');
  const domain = [-1.2, 1.25];
  const identPairs = []; for (let j = 0; j <= K; j++) identPairs.push([Q(B(K, j)), 2 * j + n - 1]);
  const mistakes = [
    K > 0 ? mk(trigSum(identPairs.map(([c, p]) => [Q.div(c, Q(p + 1)), p + 1]), 'sec'), 'identity', 'Identity: $\\tan^2 x = \\sec^2 x - 1$ (minus 1).', 1) : null,
    mk(trigSum(pairs.map(([c, p]) => [c, p + 1]), 'sec'), 'power', 'Divide by the new power after adding 1.', 3),
    mk(S([T(Q(1, m + 1), [pc.Trig('tan', 1, m + 1)], 'over')]), 'power', powerTrap, null),
    mk(M.sumNeg(ans), 'trig-sign', '$\\frac{d}{dx}\\sec x = +\\sec x\\tan x$. No minus.', 2),
  ];
  const steps = [
    { title: 'Spot the odd tan', think: `$\\tan$ has power ${m} (odd) and $\\sec$ has ${n} (odd, so saving $\\sec^2$ will not work). Save $\\sec x\\tan x$; that is $du$ for $u = \\sec x$.`, lines: [`\\int ${integrandTex}\\,dx`], check: strategyChoice('saveSecTan', { saveSec2: `$\\sec$ has an odd power (${n}), so you cannot save $\\sec^2$ and convert the rest.`, half: 'Half-angle is for $\\sin$/$\\cos$.' }), tag: 'strategy' },
  ];
  if (K > 0) steps.push({ title: 'Convert the extra tan', think: `Keep $\\sec x\\tan x$. Write the other $\\tan^{${m - 1}} x = (\\tan^2 x)^{${K}}$ in terms of $\\sec$.`, lines: [`\\int (\\tan^{2}x)^{${K}}${n - 1 ? trigPow('sec', n - 1) : ''}\\,\\sec x\\tan x\\,dx = \\int (\\sec^{2}x - 1)^{${K}}${n - 1 ? trigPow('sec', n - 1) : ''}\\,\\sec x\\tan x\\,dx`], check: st.choice('$\\tan^2 x = \\;?$', [{ tex: '\\sec^{2} x - 1', ok: true }, { tex: '1 - \\sec^{2} x', msg: 'Flip it: $1 + \\tan^2 = \\sec^2$, so $\\tan^2 = \\sec^2 - 1$.' }, { tex: '\\sec^{2} x + 1', msg: 'Minus 1: $\\tan^2 = \\sec^2 - 1$.' }], 2), tag: 'identity' });
  steps.push({ title: 'Substitute u = sec x', think: 'Differentiate $\\sec x$.', lines: ['u = \\sec x \\;\\Rightarrow\\; du = \\sec x\\tan x\\,dx'], check: st.expr('du =', { suffixTex: '\\,dx', expect: (x) => Math.tan(x) / Math.cos(x), exact: true, domain, mistakes: [{ f: (x) => 1 / Math.cos(x) ** 2, msg: 'That is the derivative of $\\tan x$. For $\\sec x$ it is $\\sec x\\tan x$.', tag: 'derivative' }], points: K > 0 ? 2 : 3, answerTex: '\\sec x\\tan x' }), tag: 'derivative' });
  steps.push({ title: 'Integrate in u', think: 'Expand and power-rule each term.', lines: [`= \\int \\left(${polyU.tex}\\right)du = ${Gu.tex} + C`], check: st.expr(`\\int \\left(${polyU.tex}\\right)du =`, { vars: ['u'], expect: Gu.f, exact: false, domain: [1.1, 2.2], mistakes: [], points: K > 0 ? 3 : 4, answerTex: Gu.tex }), tag: 'power' });
  steps.push({ title: 'Back to x, then + C', think: 'Every $u$ becomes $\\sec x$.', lines: [`\\int ${integrandTex}\\,dx = ${ans.tex} + C`], check: st.final(3), tag: 'backsub' });
  return {
    family: 'tan_odd', famLabel: 'tanᵐ (odd) · secⁿ', level: m + n > 4 ? 2 : 1,
    tex: `\\int ${integrandTex}\\,dx`, f, domain, answer: ans, mistakes,
    hints: ['Odd power of $\\tan$: save $\\sec x\\tan x$.', 'Convert remaining $\\tan^2$ with $\\tan^2 = \\sec^2 - 1$.', '$u = \\sec x$, $du = \\sec x\\tan x\\,dx$.'],
    steps,
  };
}

/* ---------- specials: tan², tan³, cot, sec, sec³ ---------- */
function special(level, r, fx = {}) {
  const kind = fx.kind ?? (level === 3 ? r.pick(['sec3', 'tan3', 'sec3']) : r.pick(['tan2', 'tan3', 'cot', 'sec', 'tan2']));
  const X = pc.X(1);
  const lnAbs = (tex, ascii, g) => pc.Raw(`\\ln\\left|${tex}\\right|`, `ln(abs(${ascii}))`, (x) => Math.log(Math.abs(g(x))));
  const lnSecTan = lnAbs('\\sec x + \\tan x', 'sec(x)+tan(x)', (x) => 1 / Math.cos(x) + Math.tan(x));
  const lnCos = lnAbs('\\cos x', 'cos(x)', Math.cos);
  if (kind === 'tan2') {
    const ans = S([T(1, [pc.Trig('tan', 1)]), T(-1, [X])]);
    return {
      family: 'special', famLabel: 'tan²x', level: 1, tex: '\\int \\tan^{2} x\\,dx', f: (x) => Math.tan(x) ** 2, domain: [-1.2, 1.25], answer: ans,
      mistakes: [
        mk(S([T(1, [pc.Trig('tan', 1)]), T(1, [X])]), 'identity', '$\\tan^2 x = \\sec^2 x - 1$, so you subtract $x$.', 0),
        mk(S([T(Q(1, 3), [pc.Trig('tan', 1, 3)], 'over')]), 'power', powerTrap, null),
        mk(S([T(Q(1, 3), [pc.Trig('sec', 1, 3)], 'over'), T(-1, [X])]), 'power', '$\\int\\sec^2 x\\,dx = \\tan x$ (you know its derivative). It is not a power rule.', 1),
      ],
      hints: ['No $\\sec$ to save. Use an identity to turn $\\tan^2$ into something you can integrate.', '$\\tan^2 x = \\sec^2 x - 1$.', '$\\int\\sec^2 x\\,dx = \\tan x$.'],
      steps: [
        { title: 'Rewrite with an identity', think: 'You know $\\int\\sec^2 x\\,dx$. Turn $\\tan^2$ into $\\sec^2$.', lines: ['\\int \\tan^{2}x\\,dx = \\int (\\sec^{2}x - 1)\\,dx'], check: st.choice('$\\tan^2 x = \\;?$', [{ tex: '\\sec^{2}x - 1', ok: true }, { tex: '\\sec^{2}x + 1', msg: '$1 + \\tan^2 = \\sec^2$, so $\\tan^2 = \\sec^2 - 1$.' }, { tex: '1 - \\sec^{2} x', msg: 'Other way: $\\sec^2 x - 1$.' }], 4), tag: 'identity' },
        { title: 'Integrate sec²', think: 'Which function has derivative $\\sec^2 x$?', lines: ['\\int \\sec^{2}x\\,dx = \\tan x'], check: st.expr('\\int \\sec^{2}x\\,dx =', { expect: Math.tan, exact: false, domain: [-1.2, 1.25], mistakes: [{ f: (x) => 1 / Math.cos(x) ** 3 / 3, msg: 'No power rule on trig. Which function differentiates to $\\sec^2 x$?', tag: 'power' }], points: 4, answerTex: '\\tan x' }), tag: 'derivative' },
        { title: 'Finish + C', think: 'Subtract $\\int 1\\,dx = x$. Then $+C$.', lines: ['\\int \\tan^{2}x\\,dx = \\tan x - x + C'], check: st.final(4), tag: 'algebra' },
      ],
    };
  }
  if (kind === 'tan3') {
    const ans = S([T(Q(1, 2), [pc.Trig('tan', 1, 2)], 'over'), T(1, [lnCos])]);
    return {
      family: 'special', famLabel: 'tan³x', level: 2, tex: '\\int \\tan^{3} x\\,dx', f: (x) => Math.tan(x) ** 3, domain: [0.1, 1.3], absDomain: [1.9, 3.0], answer: ans,
      mistakes: [
        mk(S([T(Q(1, 2), [pc.Trig('tan', 1, 2)], 'over'), T(-1, [lnCos])]), 'trig-sign', '$\\int\\tan x\\,dx = -\\ln|\\cos x|$. Subtracting it gives $+\\ln|\\cos x|$.', 2),
        mk(S([T(Q(1, 4), [pc.Trig('tan', 1, 4)], 'over')]), 'power', powerTrap, null),
        mk(S([T(Q(1, 2), [pc.Trig('tan', 1, 2)], 'over')]), 'rounds', 'You still need $-\\int\\tan x\\,dx$.', 2),
      ],
      hints: ['$\\tan^3 = \\tan\\cdot\\tan^2$. Convert the $\\tan^2$.', '$\\tan^3 x = \\tan x\\sec^2 x - \\tan x$.', 'First piece: $u = \\tan x$. Second piece: $\\int\\tan x\\,dx = -\\ln|\\cos x|$.'],
      steps: [
        { title: 'Peel off tan²', think: 'Odd power of $\\tan$ but no $\\sec$. Split off $\\tan^2$ and convert it.', lines: ['\\tan^{3}x = \\tan x\\,(\\sec^{2}x - 1) = \\tan x\\sec^{2}x - \\tan x'], check: st.choice('$\\tan^3 x = \\;?$', [{ tex: '\\tan x\\sec^{2}x - \\tan x', ok: true }, { tex: '\\tan x\\sec^{2}x + \\tan x', msg: '$\\tan^2 = \\sec^2 - 1$ brings a minus.' }, { tex: '\\sec^{3}x - 1', msg: 'Only one $\\tan^2$ gets converted; one $\\tan x$ stays.' }], 3), tag: 'identity' },
        { title: 'First piece: u = tan x', think: '$\\int\\tan x\\sec^2 x\\,dx$ with $u = \\tan x$, $du = \\sec^2 x\\,dx$.', lines: ['\\int \\tan x\\sec^{2}x\\,dx = \\int u\\,du = \\frac{\\tan^{2}x}{2}'], check: st.expr('\\int \\tan x\\sec^{2}x\\,dx =', { expect: (x) => Math.tan(x) ** 2 / 2, exact: false, domain: [0.1, 1.3], mistakes: [{ f: (x) => Math.tan(x) ** 2, msg: '$\\int u\\,du = \\frac{u^2}{2}$.', tag: 'power' }], points: 3, answerTex: '\\frac{\\tan^{2}x}{2}' }), tag: 'power' },
        { title: 'Second piece: ∫tan x', think: 'Memorize: $\\int\\tan x\\,dx = -\\ln|\\cos x| = \\ln|\\sec x|$.', lines: ['\\int \\tan x\\,dx = -\\ln|\\cos x|'], check: st.expr('\\int \\tan x\\,dx =', { expect: (x) => -Math.log(Math.abs(Math.cos(x))), exact: false, domain: [0.1, 1.3], mistakes: [{ f: (x) => Math.log(Math.abs(Math.cos(x))), msg: 'Sign: $\\int\\tan x\\,dx = -\\ln|\\cos x|$.', tag: 'trig-sign' }, { f: (x) => 1 / Math.cos(x) ** 2, msg: 'That is the derivative of $\\tan$.', tag: 'direction' }], points: 3, answerTex: '-\\ln|\\cos x|' }), tag: 'trig-sign' },
        { title: 'Combine + C', think: 'First piece minus second piece.', lines: ['\\frac{\\tan^{2}x}{2} - \\left(-\\ln|\\cos x|\\right) = \\frac{\\tan^{2}x}{2} + \\ln|\\cos x| + C'], check: st.final(3), tag: 'algebra' },
      ],
    };
  }
  if (kind === 'cot') {
    const lnSin = lnAbs('\\sin x', 'sin(x)', Math.sin);
    const ans = S([T(1, [lnSin])]);
    return {
      family: 'special', famLabel: 'cot x', level: 1, tex: '\\int \\cot x\\,dx', f: (x) => Math.cos(x) / Math.sin(x), domain: [0.2, 2.9], absDomain: [3.4, 6.0], answer: ans,
      mistakes: [
        mk(S([T(-1, [lnSin])]), 'trig-sign', 'With $u = \\sin x$, $du = +\\cos x\\,dx$, so no minus.', 1),
        mk(S([T(1, [lnCos])]), 'usub', 'Rewrite $\\cot = \\frac{\\cos}{\\sin}$: the bottom is $\\sin x$, so $u = \\sin x$.', 0),
        mk(S([T(-1, [pc.Raw('\\csc^{2}x', 'csc(x)^2', (x) => 1 / Math.sin(x) ** 2)])]), 'direction', 'That is the derivative of $\\cot x$. We need the antiderivative.', null),
      ],
      hints: ['Rewrite $\\cot x = \\frac{\\cos x}{\\sin x}$.', 'Let $u = \\sin x$; $du = \\cos x\\,dx$ is sitting on top.', '$\\int\\frac{du}{u} = \\ln|u|$.'],
      steps: [
        { title: 'Rewrite as sin and cos', think: 'When stuck with tan, cot, sec or csc alone, rewrite in $\\sin$ and $\\cos$.', lines: ['\\int \\cot x\\,dx = \\int \\frac{\\cos x}{\\sin x}\\,dx'], check: st.choice('Best $u$?', [{ tex: 'u = \\sin x', ok: true }, { tex: 'u = \\cos x', msg: 'Then $du = -\\sin x\\,dx$, and there is no $\\sin x$ on top to use.' }, { tex: 'u = \\cot x', msg: 'Then $du = -\\csc^2 x\\,dx$, which is not in the problem.' }], 4), tag: 'usub' },
        { title: 'Find du', think: 'Differentiate $u = \\sin x$.', lines: ['du = \\cos x\\,dx \\;\\Rightarrow\\; \\int \\frac{du}{u} = \\ln|u|'], check: st.expr('du =', { suffixTex: '\\,dx', expect: Math.cos, exact: true, domain: [0.2, 2.9], mistakes: [{ f: (x) => -Math.cos(x), msg: '$\\frac{d}{dx}\\sin x = +\\cos x$.', tag: 'trig-sign' }], points: 4, answerTex: '\\cos x' }), tag: 'derivative' },
        { title: 'Back to x + C', think: '$\\ln|u|$ with $u = \\sin x$. Keep the absolute value.', lines: ['\\int \\cot x\\,dx = \\ln|\\sin x| + C'], check: st.final(4), tag: 'abs' },
      ],
    };
  }
  if (kind === 'sec') {
    const ans = S([T(1, [lnSecTan])]);
    return {
      family: 'special', famLabel: 'sec x', level: 2, tex: '\\int \\sec x\\,dx', f: (x) => 1 / Math.cos(x), domain: [-1.2, 1.25], absDomain: [1.9, 3.0], answer: ans,
      mistakes: [
        mk(S([T(1, [lnAbs('\\sec x', 'sec(x)', (x) => 1 / Math.cos(x))])]), 'usub', 'That is $\\int\\tan x\\,dx$. For $\\sec x$ it is $\\ln|\\sec x + \\tan x|$.', 1),
        mk(S([T(1, [pc.Raw('\\sec x\\tan x', 'sec(x)*tan(x)', (x) => Math.tan(x) / Math.cos(x))])]), 'direction', 'That is the derivative of $\\sec x$.', null),
        mk(S([T(-1, [lnSecTan])]), 'sign', 'Sign: $\\int\\sec x\\,dx = +\\ln|\\sec x + \\tan x|$.', 1),
      ],
      hints: ['This one is a famous trick (or just memorize it).', 'Multiply by $\\frac{\\sec x + \\tan x}{\\sec x + \\tan x}$.', 'Then $u = \\sec x + \\tan x$ and the top is exactly $du$.'],
      steps: [
        { title: 'The famous trick', think: 'Multiply top and bottom by $\\sec x + \\tan x$. (Nobody invents this on the spot: it is a classic to memorize.)', lines: ['\\int \\sec x\\cdot\\frac{\\sec x + \\tan x}{\\sec x + \\tan x}\\,dx = \\int \\frac{\\sec^{2}x + \\sec x\\tan x}{\\sec x + \\tan x}\\,dx'], check: st.choice('Now let $u = \\;?$', [{ tex: '\\sec x + \\tan x', ok: true }, { tex: '\\sec^{2}x + \\sec x\\tan x', msg: 'Let $u$ be the bottom, so the top is $du$.' }, { tex: '\\sec x', msg: 'Use the whole denominator.' }], 4), tag: 'usub' },
        { title: 'Check du is on top', think: 'Differentiate $\\sec x + \\tan x$.', lines: ['du = (\\sec x\\tan x + \\sec^{2}x)\\,dx \\;\\Rightarrow\\; \\int\\frac{du}{u} = \\ln|u|'], check: st.expr('du =', { suffixTex: '\\,dx', expect: (x) => Math.tan(x) / Math.cos(x) + 1 / Math.cos(x) ** 2, exact: true, domain: [-1.2, 1.25], mistakes: [], points: 4, answerTex: '\\sec x\\tan x + \\sec^{2}x' }), tag: 'derivative' },
        { title: 'Answer + C', think: '$\\ln|u|$, then put $u$ back.', lines: ['\\int \\sec x\\,dx = \\ln|\\sec x + \\tan x| + C'], check: st.final(4), tag: 'abs' },
      ],
    };
  }
  // sec³ (boomerang)
  const SecTan = pc.Raw('\\sec x\\tan x', 'sec(x)*tan(x)', (x) => Math.tan(x) / Math.cos(x));
  const ans = S([T(Q(1, 2), [SecTan]), T(Q(1, 2), [lnSecTan])]);
  return {
    family: 'special', famLabel: 'sec³x', level: 3, tex: '\\int \\sec^{3} x\\,dx', f: (x) => 1 / Math.cos(x) ** 3, domain: [-1.2, 1.25], absDomain: [1.9, 3.0], answer: ans,
    mistakes: [
      mk(S([T(1, [SecTan]), T(1, [lnSecTan])]), 'boomerang', 'You found $2I = \\dots$. Divide both sides by 2.', 3),
      mk(S([T(Q(1, 2), [SecTan]), T(Q(-1, 2), [lnSecTan])]), 'sign', 'After moving $-I$ over, everything on the right keeps its sign: $+\\int\\sec x\\,dx$.', 2),
      mk(S([T(Q(1, 4), [pc.Trig('sec', 1, 4)], 'over')]), 'power', powerTrap, null),
      mk(S([T(1, [SecTan])]), 'rounds', 'Do not drop the $\\int\\sec x\\,dx$ piece.', 3),
    ],
    hints: ['Odd power of sec alone: integration by parts. $u = \\sec x$, $dv = \\sec^2 x\\,dx$.', 'You will get $\\int\\sec x\\tan^2 x$; use $\\tan^2 = \\sec^2 - 1$.', 'The original integral comes back: solve for it.'],
    steps: [
      { title: 'Parts: pick u', think: 'Split $\\sec^3 = \\sec\\cdot\\sec^2$. You can integrate $\\sec^2$.', lines: ['u = \\sec x,\\quad dv = \\sec^{2}x\\,dx,\\quad du = \\sec x\\tan x\\,dx,\\quad v = \\tan x'], check: st.choice('Best split?', [{ tex: 'u = \\sec x,\\; dv = \\sec^{2}x\\,dx', ok: true }, { tex: 'u = \\sec^{2}x,\\; dv = \\sec x\\,dx', msg: 'Then $v = \\ln|\\sec + \\tan|$ and things get ugly.' }, { tex: 'u = \\sec^{3}x,\\; dv = dx', msg: 'Then $v = x$ and the new integral has $x$ times trig. Worse.' }], 2), tag: 'liate' },
      { title: 'Round 1 + identity', think: '$uv - \\int v\\,du$, then turn $\\tan^2$ into $\\sec^2 - 1$.', lines: ['I = \\sec x\\tan x - \\int \\tan x\\cdot\\sec x\\tan x\\,dx = \\sec x\\tan x - \\int \\sec x\\,(\\sec^{2}x - 1)\\,dx', 'I = \\sec x\\tan x - I + \\int \\sec x\\,dx'], check: st.choice('After the identity, the integral splits into:', [{ tex: '-\\int\\sec^{3}x\\,dx + \\int\\sec x\\,dx', ok: true }, { tex: '-\\int\\sec^{3}x\\,dx - \\int\\sec x\\,dx', msg: 'Distribute the minus: $-(\\sec^3 - \\sec) = -\\sec^3 + \\sec$.' }, { tex: '+\\int\\sec^{3}x\\,dx - \\int\\sec x\\,dx', msg: 'The formula minus stays in front of $\\sec^3$.' }], 3), tag: 'sign' },
      { title: 'Solve for I', think: 'Add $I$ to both sides. How many $I$s on the left?', lines: ['2I = \\sec x\\tan x + \\ln|\\sec x + \\tan x|'], check: st.num('\\text{left side} = \\;?\\cdot I', 2, { points: 3, answerTex: '2' }), tag: 'boomerang' },
      { title: 'Divide by 2, + C', think: 'Halve everything.', lines: [`I = ${ans.tex} + C`], check: st.final(4), tag: 'algebra' },
    ],
  };
}

/* ---------- product-to-sum ---------- */
function prod(level, r, fx = {}) {
  const type = fx.type ?? r.pick(['sc', 'ss', 'cc', 'sc']);
  let a = fx.a ?? r.int(1, 5), b = fx.b ?? r.int(1, 5);
  while (a === b) b = r.int(1, 5);
  if (type !== 'sc' && a < b) [a, b] = [b, a];
  const nm = { sc: ['sin', 'cos'], ss: ['sin', 'sin'], cc: ['cos', 'cos'] }[type];
  const t1 = pc.Trig(nm[0], a), t2 = pc.Trig(nm[1], b);
  const f = (x) => M.TRIGF[nm[0]](a * x) * M.TRIGF[nm[1]](b * x);
  const d = Math.abs(a - b), s = a + b;
  let ans, idTex, rew;
  if (type === 'sc') {
    if (a > b) { ans = S([T(Q(-1, 2 * d), [pc.Trig('cos', d)], 'over'), T(Q(-1, 2 * s), [pc.Trig('cos', s)], 'over')]); rew = `\\frac{1}{2}\\left[\\sin(${M.axTex(d)}) + \\sin(${M.axTex(s)})\\right]`; }
    else { ans = S([T(Q(1, 2 * d), [pc.Trig('cos', d)], 'over'), T(Q(-1, 2 * s), [pc.Trig('cos', s)], 'over')]); rew = `\\frac{1}{2}\\left[\\sin(${M.axTex(s)}) - \\sin(${M.axTex(d)})\\right]`; }
    idTex = '\\sin A\\cos B = \\tfrac{1}{2}\\left[\\sin(A-B) + \\sin(A+B)\\right]';
  } else if (type === 'ss') {
    ans = S([T(Q(1, 2 * d), [pc.Trig('sin', d)], 'over'), T(Q(-1, 2 * s), [pc.Trig('sin', s)], 'over')]);
    rew = `\\frac{1}{2}\\left[\\cos(${M.axTex(d)}) - \\cos(${M.axTex(s)})\\right]`;
    idTex = '\\sin A\\sin B = \\tfrac{1}{2}\\left[\\cos(A-B) - \\cos(A+B)\\right]';
  } else {
    ans = S([T(Q(1, 2 * d), [pc.Trig('sin', d)], 'over'), T(Q(1, 2 * s), [pc.Trig('sin', s)], 'over')]);
    rew = `\\frac{1}{2}\\left[\\cos(${M.axTex(d)}) + \\cos(${M.axTex(s)})\\right]`;
    idTex = '\\cos A\\cos B = \\tfrac{1}{2}\\left[\\cos(A-B) + \\cos(A+B)\\right]';
  }
  const IDS = {
    sc: '\\tfrac{1}{2}\\left[\\sin(A-B) + \\sin(A+B)\\right]',
    ss: '\\tfrac{1}{2}\\left[\\cos(A-B) - \\cos(A+B)\\right]',
    cc: '\\tfrac{1}{2}\\left[\\cos(A-B) + \\cos(A+B)\\right]',
  };
  const lhs = { sc: '\\sin A\\cos B', ss: '\\sin A\\sin B', cc: '\\cos A\\cos B' }[type];
  const idOpts = Object.entries(IDS).map(([k, v]) => (k === type ? { tex: v, ok: true } : { tex: v, msg: `That is the identity for $${{ sc: '\\sin A\\cos B', ss: '\\sin A\\sin B', cc: '\\cos A\\cos B' }[k]}$.` }));
  idOpts.push({ tex: IDS[type].replace('\\tfrac{1}{2}', ''), msg: 'Do not forget the $\\frac{1}{2}$ in front.' });
  const prodWrong = (() => { // integrate each factor separately
    const i1 = nm[0] === 'sin' ? { c: Q(-1, a), n: 'cos' } : { c: Q(1, a), n: 'sin' };
    const i2 = nm[1] === 'sin' ? { c: Q(-1, b), n: 'cos' } : { c: Q(1, b), n: 'sin' };
    return S([T(Q.mul(i1.c, i2.c), [pc.Trig(i1.n, a), pc.Trig(i2.n, b)])]);
  })();
  const domain = [-1.4, 1.5];
  const mistakes = [
    mk(prodWrong, 'product', 'You integrated each factor separately. The integral of a product is not the product of the integrals. Use product-to-sum first.', null),
    mk(M.sumScale(ans, 2), 'identity', 'The product-to-sum identity has a $\\frac12$ in front.', 0),
    mk(S([ans.terms[0], T(Q.neg(ans.terms[1].c), [ans.terms[1].pieces[0]], 'over')]), 'sign', 'One of the two pieces has the wrong sign. Check the identity and $\\int\\sin = -\\cos$.', 2),
    mk(S(ans.terms.map((t) => T(Q.mul(t.c, Q(t === ans.terms[0] ? d : s)), t.pieces, 'over'))), 'kfactor', 'When you integrate $\\sin(kx)$ or $\\cos(kx)$, divide by $k$.', 2),
  ];
  return {
    family: 'prod', famLabel: 'product-to-sum', level: 2,
    tex: `\\int ${t1.tex}\\,${t2.tex}\\,dx`, f, domain, answer: ans, mistakes,
    hints: ['Different angles multiplied: product-to-sum identity.', `$${idTex}$`, 'Then integrate each piece (divide by the number next to $x$).'],
    steps: [
      { title: 'Product-to-sum', think: 'Two trig functions with different angles can\'t be u-subbed. Turn the product into a sum.', lines: [idTex], check: st.choice(`$${lhs} = \\;?$`, idOpts, 3), tag: 'identity' },
      { title: 'Rewrite the integrand', think: `Here $A = ${M.axTex(a)}$ and $B = ${M.axTex(b)}$. Plug them in fully, then simplify the angles.`, lines: [`${t1.tex}\\,${t2.tex} = ${rew}`], check: null, tag: 'identity' },
      { title: 'Integrate one piece', think: `Integrate the $${s}x$ piece first. Divide by ${s}, and check the sign.`, lines: [type === 'sc' ? `\\int\\sin(${s}x)\\,dx = -\\frac{\\cos(${s}x)}{${s}}` : `\\int\\cos(${s}x)\\,dx = \\frac{\\sin(${s}x)}{${s}}`], check: type === 'sc'
        ? st.expr(`\\int \\sin(${s}x)\\,dx =`, { expect: (x) => -Math.cos(s * x) / s, exact: false, domain, mistakes: [{ f: (x) => Math.cos(s * x) / s, msg: '$\\int\\sin = -\\cos$.', tag: 'trig-sign' }, { f: (x) => -Math.cos(s * x), msg: `Divide by ${s}.`, tag: 'kfactor' }], points: 3, answerTex: `-\\frac{\\cos(${s}x)}{${s}}` })
        : st.expr(`\\int \\cos(${s}x)\\,dx =`, { expect: (x) => Math.sin(s * x) / s, exact: false, domain, mistakes: [{ f: (x) => -Math.sin(s * x) / s, msg: '$\\int\\cos = +\\sin$.', tag: 'trig-sign' }, { f: (x) => Math.sin(s * x), msg: `Divide by ${s}.`, tag: 'kfactor' }], points: 3, answerTex: `\\frac{\\sin(${s}x)}{${s}}` }), tag: 'kfactor' },
      { title: 'Both pieces + C', think: 'Do the same for the other piece, multiply by the $\\frac{1}{2}$, add $+C$.', lines: [`\\int ${t1.tex}\\,${t2.tex}\\,dx = ${ans.tex} + C`], check: st.final(6), tag: 'algebra' },
    ],
  };
}

const FAM = { sin_odd, cos_odd, even, tan_sec_even, tan_odd, special, prod };
M.TRIG_FAMILIES = FAM;
const BY_LEVEL = {
  1: [[sin_odd, 3], [cos_odd, 3], [even, 3], [tan_sec_even, 2], [tan_odd, 2], [special, 1]],
  2: [[sin_odd, 2], [cos_odd, 2], [even, 3], [tan_sec_even, 2], [tan_odd, 2], [special, 2], [prod, 2]],
  3: [[special, 3], [prod, 2], [even, 2], [sin_odd, 1], [cos_odd, 1], [tan_sec_even, 1], [tan_odd, 1]],
};
M.GEN.trig = function (level, r, family) {
  const fam = family ? FAM[family] : r.pickW(BY_LEVEL[level] || BY_LEVEL[1]);
  const p = fam(level, r);
  p.level = level;
  return p;
};
})(typeof globalThis !== 'undefined' ? globalThis : this);
