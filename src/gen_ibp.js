/* ==========================================================================
   UNIT 1 — Integration by Parts
   ========================================================================== */
(function (G) {
'use strict';
const M = G.M, Q = M.Q, T = M.term, S = M.sum, pc = M.pc, hl = M.hl, st = M.st;
const mk = M.mistake;

const ax = (a) => M.axTex(a);
const trigArg = (fn, a) => (a === 1 ? `\\${fn} x` : `\\${fn}(${ax(a)})`);
const P = (s) => `\\left(${s}\\right)`;

/** The standard 6-step IBP walkthrough. */
function ibpSteps(o) {
  const dvLine = o.dvTex ? `${o.dvTex}\\,dx` : 'dx';
  return [
    {
      title: 'Pick u with LIATE',
      think: o.uThink,
      lines: [`u = ${o.uTex} \\qquad dv = ${dvLine}`],
      check: st.choice('Which one should be $u$?', o.uOpts, 1),
      tag: 'liate',
    },
    {
      title: 'Differentiate u to get du',
      think: o.duThink,
      lines: [`u = ${o.uTex} \\;\\Rightarrow\\; du = ${o.duTex === '1' ? '' : o.duTex}\\,dx`],
      check: st.expr('du =', { suffixTex: '\\,dx', expect: o.du.expect, exact: true, domain: o.domain, mistakes: o.du.mistakes || [], points: 1, answerTex: o.duTex }),
      tag: 'derivative',
    },
    {
      title: 'Integrate dv to get v',
      think: o.vThink,
      lines: [`v = \\int ${dvLine} = ${o.vTex}`],
      check: st.expr('v =', { expect: o.v.expect, exact: false, domain: o.domain, mistakes: o.v.mistakes || [], points: 2, answerTex: o.vTex }),
      tag: o.vTag || 'kfactor',
    },
    {
      title: 'Plug into  uv − ∫v du',
      think: 'Write the formula with everything plugged in first, in parentheses. Simplify only after that.',
      lines: ['\\int u\\,dv = uv - \\int v\\,du', o.plugged, o.simplified],
      check: st.choice('Which setup is right?', o.setupOpts, 2),
      tag: 'formula-sign',
    },
    {
      title: 'Integrate what is left',
      think: o.restThink,
      lines: [`${o.rest.integralTex} = ${o.rest.resultTex}`],
      check: st.expr(o.rest.integralTex + ' =', { expect: o.rest.expect, exact: false, domain: o.domain, mistakes: o.rest.mistakes || [], points: 3, answerTex: o.rest.resultTex }),
      tag: o.restTag || 'kfactor',
    },
    {
      title: 'Put it together, then + C',
      think: 'Write $uv$, then subtract the result you just found (in parentheses), distribute the minus, and finish with $+C$.',
      lines: [o.combineLine || `\\int ${o.integrandTex}\\,dx = ${o.answerTex} + C`],
      check: st.final(3),
      tag: 'algebra',
    },
  ];
}
function setupOptions(uTex, vTex, duTex, dvTex) {
  const du = duTex === '1' ? 'dx' : `${P(duTex)}dx`;
  const dv = dvTex ? `${P(dvTex)}` : '(1)';
  return [
    { tex: `(${uTex})${P(vTex)} - \\int ${P(vTex)}${du}`, ok: true },
    { tex: `(${uTex})${P(vTex)} + \\int ${P(vTex)}${du}`, msg: 'The formula has a minus: $uv - \\int v\\,du$.' },
    { tex: `${P(duTex)}${P(vTex)} - \\int ${P(vTex)}(${uTex})\\,dx`, msg: 'The product out front is $u\\cdot v$ (the original $u$), and the new integral is $\\int v\\,du$.' },
    { tex: `(${uTex})${dv} - \\int ${P(vTex)}${du}`, msg: 'Out front is $u$ times $v$ (what you got by integrating), not $dv$.' },
  ];
}
function plugLines(integrandTex, uTex, vTex, duTex, simplified) {
  const du = duTex === '1' ? 'dx' : `${P(duTex)}dx`;
  return {
    plugged: `\\int ${integrandTex}\\,dx = ${hl.u(`(${uTex})`)}${hl.v(P(vTex))} - \\int ${hl.v(P(vTex))}\\,${hl.d(du)}`,
    simplified,
  };
}
const productHint = 'You integrated each factor separately. Integrals of products do not split like that, which is why integration by parts exists.';

/* ---------- x · e^{ax} ---------- */
function x_exp(level, r, fx = {}) {
  const a = fx.a ?? r.pick([1, 2, 3, -1, -2, 1, 2, 4]);
  const k = fx.k ?? r.pickW([[1, 6], [2, 2], [3, 1]]);
  const E = pc.E(a), X = pc.X(1);
  const integrandTex = `${k === 1 ? '' : k}x\\,${E.tex}`;
  const uTex = k === 1 ? 'x' : `${k}x`;
  const duTex = `${k}`;
  const v = S([T(Q(1, a), [E])]);
  const restI = S([T(Q(k, a), [E])]);
  const restR = S([T(Q(k, a * a), [E])]);
  const uv = S([T(Q(k, a), [X, E])]);
  const ans = S([T(Q(k, a), [X, E]), T(Q(-k, a * a), [E])]);
  const domain = [-1.2, 1.3];
  const restIntTex = `\\int ${restI.tex}\\,dx`;
  const { plugged, simplified } = plugLines(integrandTex, uTex, v.tex, duTex, `= ${uv.tex} - ${restIntTex}`);
  const vMist = [];
  if (a !== 1) vMist.push({ f: (x) => Math.exp(a * x), msg: `Divide by the number next to $x$: $\\int ${E.tex}dx = \\frac{1}{${a}}${E.tex}$.`, tag: 'kfactor' });
  if (Math.abs(a) > 1) vMist.push({ f: (x) => a * Math.exp(a * x), msg: 'You multiplied by $a$, which is what the chain rule does when you differentiate. Integrating divides.', tag: 'kfactor' });
  const restMist = [];
  if (a !== 1) restMist.push({ f: restI.f, msg: `Pull out the constant, then integrate $${E.tex}$: that divides by ${a} again.`, tag: 'kfactor' });
  const mistakes = [
    mk(S([T(Q(k, a), [X, E]), T(Q(k, a * a), [E])]), 'formula-sign', 'The formula is $uv - \\int v\\,du$. You added the second part instead of subtracting it.', 3),
    a !== 1 ? mk(S([T(Q(k), [X, E]), T(Q(-k, a), [E])]), 'kfactor', `When you integrated $dv = ${E.tex}\\,dx$ you forgot to divide by ${a}.`, 2) : null,
    Math.abs(a) > 1 ? mk(S([T(Q(k * a), [X, E]), T(Q(-k), [E])]), 'kfactor', `You multiplied by ${a} when integrating $${E.tex}$. Integrating divides by ${a}.`, 2) : null,
    a !== 1 ? mk(S([T(Q(k, a), [X, E]), T(Q(-k, a), [E])]), 'kfactor', `The last integral $\\int ${E.tex}dx$ needs its own $\\frac{1}{${a}}$ too.`, 4) : null,
    mk(uv, 'rounds', 'You stopped after $uv$. The $-\\int v\\,du$ part still has to be integrated.', 4),
    mk(S([T(Q(k, 2 * a), [pc.X(2), E])]), 'product', productHint, 0),
  ];
  return {
    family: 'x_exp', famLabel: 'x · eᵃˣ', level: 1,
    tex: `\\int ${integrandTex}\\,dx`, f: (x) => k * x * Math.exp(a * x), domain, answer: ans, mistakes,
    hints: [
      'Two different kinds of function multiplied together, and no u-sub in sight: integration by parts.',
      `LIATE: Algebraic beats Exponential, so $u = ${uTex}$ and $dv = ${E.tex}\\,dx$.`,
      `$du = ${k === 1 ? '' : k}\\,dx$ and $v = ${v.tex}$. Now plug into $uv - \\int v\\,du$.`,
    ],
    steps: ibpSteps({
      domain, integrandTex, uTex, dvTex: E.tex, duTex, vTex: v.tex,
      uThink: 'LIATE order: Logs, Inverse trig, Algebraic, Trig, Exponential. The one that comes first is $u$. You want $u$ to get simpler when you differentiate it.',
      duThink: `Differentiate $u = ${uTex}$.`,
      vThink: a === 1 ? 'Integrate $dv$: $e^{x}$ is its own antiderivative, $\\int e^{x}dx = e^{x}$.' : `Integrate $dv$. The number next to $x$ is ${a}, so divide by it: $\\int e^{kx}dx = \\frac{1}{k}e^{kx}$.`,
      restThink: a === 1 ? `Pull the constant out front, then integrate $${E.tex}$ again.` : `Pull the constant out front, then integrate $${E.tex}$ again (divide by ${a} again).`,
      uOpts: [
        { tex: `u = ${uTex}`, ok: true },
        { tex: `u = ${E.tex}`, msg: `Then $v = \\frac{x^2}{2}$ and the new integral has $x^2$ in it: harder, not easier. LIATE puts Algebraic before Exponential.` },
      ],
      du: { expect: () => k, mistakes: [{ f: (x) => k * x, msg: 'That is $u$ again. Take its derivative.', tag: 'derivative' }, { f: () => 0, msg: `The derivative of $${uTex}$ is ${k}, not 0.`, tag: 'derivative' }] },
      v: { expect: v.f, mistakes: vMist },
      setupOpts: setupOptions(uTex, v.tex, duTex, E.tex),
      plugged, simplified,
      rest: { integralTex: restIntTex, resultTex: restR.tex, expect: restR.f, mistakes: restMist },
      answerTex: ans.tex,
      combineLine: `${uv.tex} - \\left(${restR.tex}\\right) = ${ans.tex} + C`,
    }),
  };
}

/* ---------- x · sin(ax) / x · cos(ax) ---------- */
function x_trig(level, r, fx = {}) {
  const fn = fx.fn ?? r.pick(['sin', 'cos']);
  const a = fx.a ?? r.pick([1, 2, 3, 1, 2, 4]);
  const k = fx.k ?? r.pickW([[1, 7], [2, 2], [3, 1]]);
  const other = fn === 'sin' ? 'cos' : 'sin';
  const X = pc.X(1), Tf = pc.Trig(fn, a), To = pc.Trig(other, a);
  const integrandTex = `${k === 1 ? '' : k}x\\,${Tf.tex}`;
  const uTex = k === 1 ? 'x' : `${k}x`, duTex = `${k}`;
  const vc = fn === 'sin' ? Q(-1, a) : Q(1, a);
  const v = S([T(vc, [To])]);
  const restC = Q.mul(vc, Q(k));
  const restResC = other === 'cos' ? Q.mul(restC, Q(1, a)) : Q.mul(restC, Q(-1, a));
  const restI = S([T(restC, [To])]);
  const restR = S([T(restResC, [Tf])]);
  const uv = S([T(Q.mul(Q(k), vc), [X, To])]);
  const ans = S([T(Q.mul(Q(k), vc), [X, To]), T(Q.neg(restResC), [Tf])]);
  const domain = [-1.4, 1.5];
  const restIntTex = `\\int ${restI.tex}\\,dx`;
  const simp = `= ${uv.tex} - ${restIntTex.replace('\\int -', '\\int -')}`;
  const { plugged, simplified } = plugLines(integrandTex, uTex, v.tex, duTex, simp);
  const antiRule = fn === 'sin' ? `\\int \\sin(kx)\\,dx = -\\frac{1}{k}\\cos(kx)` : `\\int \\cos(kx)\\,dx = \\frac{1}{k}\\sin(kx)`;
  const vMist = [
    { f: (x) => -v.f(x), msg: fn === 'sin' ? 'Sign check: $\\int\\sin = -\\cos$. Your $v$ needs a minus.' : 'Sign check: $\\int\\cos = +\\sin$. No minus here.', tag: 'trig-sign' },
    { f: (x) => (fn === 'sin' ? a * Math.cos(a * x) : -a * Math.sin(a * x)), msg: `That is the derivative of $${Tf.tex}$. We need the antiderivative: $${antiRule}$.`, tag: 'direction' },
  ];
  if (a !== 1) vMist.push({ f: (x) => a * v.f(x), msg: `Divide by ${a} (the number next to $x$): $${antiRule}$.`, tag: 'kfactor' });
  const restMist = [{ f: (x) => -restR.f(x), msg: 'Sign slip while integrating the trig function. $\\int\\sin = -\\cos$, $\\int\\cos = +\\sin$.', tag: 'trig-sign' }];
  if (a !== 1) restMist.push({ f: (x) => a * restR.f(x), msg: `Divide by ${a} again when you integrate.`, tag: 'kfactor' });
  const mistakes = [
    mk(M.sumNeg(ans), 'trig-sign', fn === 'sin' ? 'Your $v$ has the wrong sign: $\\int\\sin(kx)\\,dx = -\\frac{1}{k}\\cos(kx)$. That one sign flipped the whole answer.' : 'Your $v$ has the wrong sign: $\\int\\cos(kx)\\,dx = +\\frac{1}{k}\\sin(kx)$. That one sign flipped the whole answer.', 2),
    mk(S([uv.terms[0], T(restResC, [Tf])]), 'formula-sign', 'Sign slip in the second part: either the formula\'s minus ($uv - \\int v\\,du$) or the sign when integrating the last trig function.', 3),
    a !== 1 ? mk(S([T(Q.mul(Q(k * a), vc), [X, To]), T(Q.neg(Q.mul(restResC, Q(a))), [Tf])]), 'kfactor', `When you found $v$ you forgot to divide by ${a}.`, 2) : null,
    a !== 1 ? mk(S([uv.terms[0], T(Q.neg(Q.mul(restResC, Q(a))), [Tf])]), 'kfactor', `The last integral needs its own $\\frac{1}{${a}}$.`, 4) : null,
    mk(uv, 'rounds', 'You stopped after $uv$. The $-\\int v\\,du$ part still has to be integrated.', 4),
    mk(S([T(Q.mul(Q(k, 2), vc), [pc.X(2), To])]), 'product', productHint, 0),
  ];
  return {
    family: 'x_trig', famLabel: `x · ${fn}(ax)`, level: 1,
    tex: `\\int ${integrandTex}\\,dx`, f: (x) => k * x * M.TRIGF[fn](a * x), domain, answer: ans, mistakes,
    hints: [
      'Algebra times trig: integration by parts.',
      `LIATE: Algebraic before Trig, so $u = ${uTex}$ and $dv = ${Tf.tex}\\,dx$.`,
      `$v = ${v.tex}$. Watch the sign: $${antiRule}$.`,
    ],
    steps: ibpSteps({
      domain, integrandTex, uTex, dvTex: Tf.tex, duTex, vTex: v.tex, vTag: 'trig-sign',
      uThink: 'LIATE: Logs, Inverse trig, Algebraic, Trig, Exponential. Algebraic ($x$) comes before Trig, and $x$ disappears when you differentiate it.',
      duThink: `Differentiate $u = ${uTex}$.`,
      vThink: a === 1 ? `Integrate $${Tf.tex}$. Watch the sign: $${fn === 'sin' ? '\\int \\sin x\\,dx = -\\cos x' : '\\int \\cos x\\,dx = \\sin x'}$.` : `Integrate $${Tf.tex}$. Two traps: the sign ($${antiRule}$) and dividing by ${a}.`,
      restThink: a === 1 ? 'Pull the constant out and integrate the trig function (sign check!).' : 'Pull the constant out, integrate the trig function (sign check!), and divide by the inside number again.',
      uOpts: [
        { tex: `u = ${uTex}`, ok: true },
        { tex: `u = ${Tf.tex}`, msg: `Then $v = \\frac{x^2}{2}$ and the power of $x$ goes up. That is the signal you picked the wrong split.` },
      ],
      du: { expect: () => k, mistakes: [{ f: (x) => k * x, msg: 'That is $u$ again. Take its derivative.', tag: 'derivative' }] },
      v: { expect: v.f, mistakes: vMist },
      setupOpts: setupOptions(uTex, v.tex, duTex, Tf.tex),
      plugged, simplified,
      rest: { integralTex: restIntTex, resultTex: restR.tex, expect: restR.f, mistakes: restMist },
      restTag: 'trig-sign',
      answerTex: ans.tex,
      combineLine: `${uv.tex} - \\left(${restR.tex}\\right) = ${ans.tex} + C`,
    }),
  };
}

/* ---------- ln(ax) ---------- */
function ln_ax(level, r, fx = {}) {
  const a = fx.a ?? r.pick([1, 1, 2, 3, 5]);
  const L = a === 1 ? pc.LnX() : pc.Raw(`\\ln(${a}x)`, `ln(${a}x)`, (x) => Math.log(a * x));
  const X = pc.X(1);
  const integrandTex = L.tex;
  const ans = S([T(1, [X, L]), T(-1, [X])]);
  const uv = S([T(1, [X, L])]);
  const domain = [0.4, 3.2];
  const { plugged, simplified } = plugLines(integrandTex, L.tex, 'x', '\\frac{1}{x}', `= x${L.tex} - \\int 1\\,dx`);
  const duMist = [];
  if (a !== 1) {
    duMist.push({ f: (x) => a / x, msg: `Chain rule gives $\\frac{${a}}{${a}x}$, and the ${a}'s cancel: $\\frac{1}{x}$.`, tag: 'derivative' });
    duMist.push({ f: (x) => 1 / (a * x), msg: `Chain rule: also multiply by the inside's derivative (${a}). $\\frac{1}{${a}x}\\cdot ${a} = \\frac{1}{x}$.`, tag: 'derivative' });
  }
  duMist.push({ f: (x) => x * Math.log(a * x) - x, msg: 'That is the antiderivative. For $du$ we differentiate.', tag: 'direction' });
  const mistakes = [
    mk(S([T(1, [X, L]), T(1, [X])]), 'formula-sign', 'The formula is $uv - \\int v\\,du$, so it is $x\\ln(\\dots) \\,-\\, x$.', 3),
    mk(uv, 'rounds', 'You stopped after $uv$. You still have to subtract $\\int 1\\,dx = x$.', 4),
    mk(S([T(1, [pc.Raw('\\frac{1}{x}', '1/x', (x) => 1 / x)])]), 'direction', 'That is the derivative of $\\ln$. We need the antiderivative.', null),
    mk(S([T(Q(1, 2), [pc.Pow(L, 2)])]), 'usub', 'That would be $\\int \\frac{\\ln x}{x}dx$, which is a different problem (a u-sub).', null),
    a !== 1 ? mk(S([T(1, [X, L]), T(-a, [X])]), 'derivative', `$du = \\frac{1}{x}dx$, because the ${a} cancels. With $du = \\frac{${a}}{x}dx$ you get an extra ${a}.`, 1) : null,
  ];
  return {
    family: 'ln_ax', famLabel: 'ln(ax)', level: 1,
    tex: `\\int ${integrandTex}\\,dx`, f: (x) => Math.log(a * x), domain, answer: ans, mistakes,
    hints: [
      'Only one function? Pretend it is multiplied by 1. Let $dv = dx$.',
      `$u = ${L.tex}$, $dv = dx$, so $du = \\frac{1}{x}dx$ and $v = x$.`,
      '$\\int v\\,du = \\int x\\cdot\\frac{1}{x}dx = \\int 1\\,dx$.',
    ],
    steps: ibpSteps({
      domain, integrandTex, uTex: L.tex, dvTex: '', duTex: '\\frac{1}{x}', vTex: 'x',
      uThink: 'Only one function here, so pretend it is $\\ln(\\dots)\\cdot 1$. You can differentiate $\\ln$ but you cannot integrate it yet (that is the question). So $u = \\ln$, $dv = dx$.',
      duThink: a === 1 ? 'The derivative of $\\ln x$ is $\\frac{1}{x}$.' : `Chain rule: $\\frac{d}{dx}\\ln(${a}x) = \\frac{${a}}{${a}x}$. Simplify.`,
      vThink: 'Integrate $dv = dx$. (Type $x$.)',
      restThink: '$x\\cdot\\frac{1}{x} = 1$, and $\\int 1\\,dx$ is easy.',
      uOpts: [
        { tex: `u = ${L.tex}`, ok: true },
        { tex: 'u = 1', msg: `Then $dv = ${L.tex}\\,dx$ and you would need $\\int\\ln$ to find $v$. That is the whole problem. Let $u$ be the $\\ln$.` },
      ],
      du: { expect: (x) => 1 / x, mistakes: duMist },
      v: { expect: (x) => x, mistakes: [{ f: (x) => (x * x) / 2, msg: '$dv = dx$ (just $dx$, no extra $x$), so $v = x$.', tag: 'power' }] },
      setupOpts: [
        { tex: `\\left(${L.tex}\\right)(x) - \\int (x)\\left(\\frac{1}{x}\\right)dx`, ok: true },
        { tex: `\\left(${L.tex}\\right)(x) + \\int (x)\\left(\\frac{1}{x}\\right)dx`, msg: 'The formula has a minus: $uv - \\int v\\,du$.' },
        { tex: `\\left(\\frac{1}{x}\\right)(x) - \\int (x)\\left(${L.tex}\\right)dx`, msg: 'Out front is $u\\cdot v$ with the original $u$, not $du$.' },
      ],
      plugged, simplified,
      rest: { integralTex: '\\int 1\\,dx', resultTex: 'x', expect: (x) => x, mistakes: [{ f: () => 1, msg: '$\\int 1\\,dx = x$ (antiderivative), not 1.', tag: 'direction' }] },
      restTag: 'power',
      answerTex: ans.tex,
      combineLine: `x${L.tex} - x + C`,
    }),
  };
}

/* ---------- x^n · ln x ---------- */
function xn_ln(level, r, fx = {}) {
  const n = fx.n ?? r.pick([1, 2, 3, 4, 1, 2, -2]);
  const L = pc.LnX();
  const domain = [0.4, 3.0];
  const f = (x) => Math.pow(x, n) * Math.log(x);
  let integrandTex, ans, uv, vTex, restIntTex, restR, mistakes, vF, restF, plugged, simplified;
  if (n > 0) {
    const m = n + 1;
    integrandTex = `${n === 1 ? 'x' : `x^{${n}}`}\\ln x`;
    const Xm = pc.X(m);
    vTex = `\\frac{x^{${m}}}{${m}}`;
    vF = (x) => Math.pow(x, m) / m;
    uv = S([T(Q(1, m), [Xm, L], 'over')]);
    restR = S([T(Q(1, m * m), [Xm], 'over')]);
    restF = restR.f;
    restIntTex = `\\int \\frac{x^{${m}}}{${m}}\\cdot\\frac{1}{x}\\,dx`;
    ans = S([T(Q(1, m), [Xm, L], 'over'), T(Q(-1, m * m), [Xm], 'over')]);
    ({ plugged, simplified } = plugLines(integrandTex, '\\ln x', vTex, '\\frac{1}{x}', `= ${uv.tex} - \\frac{1}{${m}}\\int ${n === 1 ? 'x' : `x^{${n}}`}\\,dx`));
    mistakes = [
      mk(S([T(Q(1, m), [Xm, L], 'over'), T(Q(1, m * m), [Xm], 'over')]), 'formula-sign', 'The formula is $uv - \\int v\\,du$. The second part gets subtracted.', 3),
      mk(S([T(Q(1, m), [Xm, L], 'over'), T(Q(-1, m), [Xm], 'over')]), 'power', `The last integral: $\\frac{1}{${m}}\\int x^{${n}}dx = \\frac{1}{${m}}\\cdot\\frac{x^{${m}}}{${m}}$. Reverse power rule divides.`, 4),
      mk(S([T(1, [Xm, L]), T(Q(-1, m), [Xm], 'over')]), 'power', `When you integrated $dv = x^{${n}}dx$ you forgot to divide by ${m}. Add 1 to the power, then divide.`, 2),
      mk(S([T(Q(1, m), [Xm, L], 'over'), T(Q(-1, m * (m + 1)), [pc.X(m + 1)], 'over')]), 'derivative', 'Looks like you used $du = dx$. The derivative of $\\ln x$ is $\\frac{1}{x}$, which cancels one power of $x$.', 1),
      mk(uv, 'rounds', 'You stopped after $uv$. The $-\\int v\\,du$ part still needs integrating.', 4),
      mk(S([T(Q(1, m), [Xm, pc.Paren(S([T(1, [pc.X(1), L]), T(-1, [pc.X(1)])]))], 'over')]), 'product', productHint, 0),
    ];
  } else { // n = -2
    integrandTex = '\\frac{\\ln x}{x^{2}}';
    vTex = '-\\frac{1}{x}';
    vF = (x) => -1 / x;
    const lnOverX = pc.Raw('\\frac{\\ln x}{x}', 'ln(x)/x', (x) => Math.log(x) / x);
    const oneOverX = pc.Raw('\\frac{1}{x}', '1/x', (x) => 1 / x);
    uv = S([T(-1, [lnOverX])]);
    restR = S([T(1, [oneOverX])]);
    restF = restR.f;
    restIntTex = '\\int \\left(-\\frac{1}{x}\\right)\\frac{1}{x}\\,dx';
    ans = S([T(-1, [lnOverX]), T(-1, [oneOverX])]);
    ({ plugged, simplified } = plugLines(integrandTex, '\\ln x', vTex, '\\frac{1}{x}', `= -\\frac{\\ln x}{x} + \\int \\frac{1}{x^{2}}\\,dx`));
    restR = S([T(1, [oneOverX])]);
    mistakes = [
      mk(S([T(-1, [lnOverX]), T(1, [oneOverX])]), 'formula-sign', 'Careful with the double negative: $-\\int\\left(-\\frac{1}{x^2}\\right)dx = +\\int x^{-2}dx = -\\frac{1}{x}$.', 4),
      mk(S([T(1, [lnOverX]), T(1, [oneOverX])]), 'power', '$\\int x^{-2}dx = \\frac{x^{-1}}{-1} = -\\frac{1}{x}$. The $-1$ in the denominator is the trap.', 2),
      mk(S([T(-1, [lnOverX])]), 'rounds', 'You stopped after $uv$.', 4),
      mk(S([T(Q(-1, 3), [pc.Raw('\\frac{1}{x^{3}}', '1/x^3', (x) => 1 / x ** 3)])]), 'direction', 'That is a derivative-style answer. Integrate instead.', null),
    ];
  }
  const restMist = [];
  if (n > 0) restMist.push({ f: (x) => Math.pow(x, n + 1) / (n + 1), msg: `Do not forget the $\\frac{1}{${n + 1}}$ that was already out front.`, tag: 'power' });
  return {
    family: 'xn_ln', famLabel: 'xⁿ · ln x', level: 1,
    tex: `\\int ${integrandTex}\\,dx`, f, domain, answer: ans, mistakes,
    hints: [
      'A power of $x$ times $\\ln x$: integration by parts.',
      'LIATE: Logs come first, so $u = \\ln x$ and $dv$ is the power of $x$.',
      `$du = \\frac{1}{x}dx$ and $v = ${vTex}$. The $\\frac{1}{x}$ will cancel a power of $x$.`,
    ],
    steps: ibpSteps({
      domain, integrandTex, uTex: '\\ln x', dvTex: n > 0 ? (n === 1 ? 'x' : `x^{${n}}`) : 'x^{-2}', duTex: '\\frac{1}{x}', vTex,
      uThink: 'LIATE starts with L for Logs. Also, you cannot integrate $\\ln x$ easily, but you can differentiate it.',
      duThink: 'The derivative of $\\ln x$ is $\\frac{1}{x}$.',
      vThink: 'Reverse power rule: add 1 to the power, then divide by the new power.',
      restThink: 'Simplify first: one power of $x$ cancels with the $\\frac{1}{x}$. Then power rule again.',
      uOpts: [
        { tex: 'u = \\ln x', ok: true },
        { tex: `u = ${n > 0 ? (n === 1 ? 'x' : `x^{${n}}`) : 'x^{-2}'}`, msg: 'Then $dv = \\ln x\\,dx$ and you would need $\\int\\ln x$ just to find $v$. LIATE: Logs go first.' },
      ],
      du: { expect: (x) => 1 / x, mistakes: [{ f: () => 1, msg: 'The derivative of $\\ln x$ is $\\frac{1}{x}$, not 1.', tag: 'derivative' }] },
      v: { expect: vF, mistakes: n > 0 ? [{ f: (x) => Math.pow(x, n + 1), msg: `Add 1 to the power and divide by it: $\\frac{x^{${n + 1}}}{${n + 1}}$.`, tag: 'power' }, { f: (x) => n * Math.pow(x, n - 1), msg: 'That is the derivative. Integrate instead.', tag: 'direction' }] : [{ f: (x) => 1 / x, msg: '$\\int x^{-2}dx = \\frac{x^{-1}}{-1} = -\\frac{1}{x}$. Watch the sign.', tag: 'power' }] },
      setupOpts: setupOptions('\\ln x', vTex, '\\frac{1}{x}', n > 0 ? (n === 1 ? 'x' : `x^{${n}}`) : 'x^{-2}'),
      plugged, simplified,
      rest: { integralTex: restIntTex, resultTex: restR.tex, expect: restF, mistakes: restMist },
      restTag: 'power',
      answerTex: ans.tex,
      combineLine: `${uv.tex} - \\left(${restR.tex}\\right) = ${ans.tex} + C`,
    }),
  };
}

/* ---------- arctan(ax) ---------- */
function arctan_ax(level, r, fx = {}) {
  const a = fx.a ?? r.pick([1, 1, 2, 3]);
  const a2 = a * a;
  const inner = a === 1 ? M.P('x', 'x', (x) => x) : M.P(`${a}x`, `${a}x`, (x) => a * x);
  const At = pc.Arc('arctan', inner);
  const X = pc.X(1);
  const qtex = `1+${a2 === 1 ? '' : a2}x^{2}`;
  const Lq = pc.Raw(`\\ln\\left(${qtex}\\right)`, `ln(1+${a2}x^2)`, (x) => Math.log(1 + a2 * x * x));
  const duTex = `\\frac{${a}}{${qtex}}`;
  const ans = S([T(1, [X, At]), T(Q(-1, 2 * a), [Lq])]);
  const uv = S([T(1, [X, At])]);
  const restR = S([T(Q(1, 2 * a), [Lq])]);
  const domain = [-1.5, 1.8];
  const restIntTex = `\\int \\frac{${a === 1 ? '' : a}x}{${qtex}}\\,dx`;
  const { plugged, simplified } = plugLines(At.tex, At.tex, 'x', duTex, `= x${At.tex} - ${restIntTex}`);
  const mistakes = [
    mk(S([T(1, [X, At]), T(Q(1, 2 * a), [Lq])]), 'formula-sign', 'The formula subtracts: $uv - \\int v\\,du$.', 3),
    mk(S([T(1, [X, At]), T(Q(-1, a), [Lq])]), 'kfactor', `Inside u-sub: $w = ${qtex}$, $dw = ${2 * a2}x\\,dx$. That gives a factor of $\\frac{1}{${2 * a}}$ in front of the $\\ln$, not $\\frac{1}{${a}}$.`, 4),
    mk(uv, 'rounds', 'You stopped after $uv$. You still need $-\\int v\\,du$.', 4),
    mk(S([T(1, [pc.Raw(duTex, `${a}/(1+${a2}x^2)`, (x) => a / (1 + a2 * x * x))])]), 'direction', 'That is the derivative of arctan. We need the antiderivative.', null),
    mk(S([T(1, [X, At]), T(-1, [At])]), 'usub', 'The leftover integral $\\int\\frac{x}{1+x^2}dx$ is a u-sub that gives a $\\ln$, not arctan.', 4),
  ];
  return {
    family: 'arctan', famLabel: 'arctan(ax)', level: 1,
    tex: `\\int ${At.tex}\\,dx`, f: (x) => Math.atan(a * x), domain, answer: ans, mistakes,
    hints: [
      'One function you know how to differentiate but not integrate: let $dv = dx$.',
      `$u = ${At.tex}$, $du = ${duTex}\\,dx$, $v = x$.`,
      `The leftover $${restIntTex}$ is a u-sub with $w = ${qtex}$.`,
    ],
    steps: ibpSteps({
      domain, integrandTex: At.tex, uTex: At.tex, dvTex: '', duTex, vTex: 'x',
      uThink: 'LIATE: I is for Inverse trig. It is also the only function here, so $dv = dx$.',
      duThink: `$\\frac{d}{dx}\\arctan(w) = \\frac{w'}{1+w^2}$. Here $w = ${inner.tex}$.`,
      vThink: '$\\int dx = x$.',
      restThink: `This one is a u-sub: $w = ${qtex}$, $dw = ${2 * a2}x\\,dx$.`,
      uOpts: [
        { tex: `u = ${At.tex}`, ok: true },
        { tex: 'u = 1', msg: 'Then $dv = \\arctan\\,dx$, and finding $v$ is the original problem. Let $u = \\arctan$.' },
      ],
      du: { expect: (x) => a / (1 + a2 * x * x), mistakes: a !== 1 ? [{ f: (x) => 1 / (1 + a2 * x * x), msg: `Chain rule: multiply by ${a}.`, tag: 'derivative' }, { f: (x) => 1 / (1 + x * x), msg: `Inside is $${a}x$, so it is $\\frac{${a}}{1+${a2}x^2}$.`, tag: 'derivative' }] : [{ f: (x) => 1 / Math.sqrt(1 - x * x), msg: 'That is the derivative of arcsin. For arctan it is $\\frac{1}{1+x^2}$.', tag: 'derivative' }] },
      v: { expect: (x) => x, mistakes: [] },
      setupOpts: setupOptions(At.tex, 'x', duTex, ''),
      plugged, simplified,
      rest: { integralTex: restIntTex, resultTex: restR.tex, expect: restR.f, mistakes: [{ f: (x) => Math.log(1 + a2 * x * x), msg: `The u-sub leaves a constant: $dw = ${2 * a2}x\\,dx$, so you get $\\frac{1}{${2 * a}}\\ln$.`, tag: 'kfactor' }, { f: (x) => Math.atan(a * x), msg: 'This leftover is $\\frac{x}{1+x^2}$ (an $x$ on top), so it is a $\\ln$, not arctan.', tag: 'usub' }] },
      restTag: 'usub',
      answerTex: ans.tex,
      combineLine: `${uv.tex} - ${restR.tex} + C`,
    }),
  };
}

/* ---------- arcsin x / arccos x ---------- */
function arcsin_x(level, r, fx = {}) {
  const fn = fx.fn ?? r.pick(['arcsin', 'arcsin', 'arccos']);
  const X = pc.X(1);
  const Ar = pc.Arc(fn, M.P('x', 'x', (x) => x));
  const root = pc.Sqrt(M.P('1-x^{2}', '1-x^2', (x) => 1 - x * x));
  const s = fn === 'arcsin' ? 1 : -1;
  const duTex = s > 0 ? '\\frac{1}{\\sqrt{1-x^{2}}}' : '-\\frac{1}{\\sqrt{1-x^{2}}}';
  const ans = S([T(1, [X, Ar]), T(s, [root])]);
  const uv = S([T(1, [X, Ar])]);
  const restR = S([T(-s, [root])]);
  const domain = [-0.8, 0.85];
  const restIntTex = `\\int \\frac{${s > 0 ? '' : '-'}x}{\\sqrt{1-x^{2}}}\\,dx`;
  const { plugged, simplified } = plugLines(Ar.tex, Ar.tex, 'x', duTex, `= x${Ar.tex} - ${restIntTex}`);
  const mistakes = [
    mk(S([T(1, [X, Ar]), T(-s, [root])]), 'sign', `Sign trap in the u-sub: with $w = 1-x^2$, $dw = -2x\\,dx$. That minus matters.`, 4),
    mk(S([T(1, [X, Ar]), T(Q(s, 2), [root])]), 'power', '$\\int w^{-1/2}dw = 2w^{1/2}$. Dividing by $\\frac12$ doubles it.', 4),
    mk(uv, 'rounds', 'You stopped after $uv$.', 4),
    mk(S([T(1, [pc.Raw(duTex, `${s}/sqrt(1-x^2)`, (x) => s / Math.sqrt(1 - x * x))])]), 'direction', 'That is the derivative. We need the antiderivative.', null),
  ];
  return {
    family: 'arcsin', famLabel: `${fn} x`, level: 1,
    tex: `\\int ${Ar.tex}\\,dx`, f: fn === 'arcsin' ? Math.asin : Math.acos, domain, answer: ans, mistakes,
    hints: [
      'Inverse trig alone: let $dv = dx$.',
      `$u = ${Ar.tex}$, $du = ${duTex}\\,dx$, $v = x$.`,
      'The leftover integral is a u-sub with $w = 1 - x^2$.',
    ],
    steps: ibpSteps({
      domain, integrandTex: Ar.tex, uTex: Ar.tex, dvTex: '', duTex, vTex: 'x',
      uThink: 'Only one function, and it is inverse trig. Differentiate it ($u$), integrate the invisible 1 ($dv = dx$).',
      duThink: fn === 'arcsin' ? '$\\frac{d}{dx}\\arcsin x = \\frac{1}{\\sqrt{1-x^2}}$.' : '$\\frac{d}{dx}\\arccos x = -\\frac{1}{\\sqrt{1-x^2}}$.',
      vThink: '$\\int dx = x$.',
      restThink: 'u-sub: $w = 1 - x^2$, $dw = -2x\\,dx$, so $x\\,dx = -\\frac{1}{2}dw$.',
      uOpts: [
        { tex: `u = ${Ar.tex}`, ok: true },
        { tex: 'u = 1', msg: 'Then $v$ would need $\\int$ of the inverse trig function: the original problem. Let $u$ be the inverse trig.' },
      ],
      du: { expect: (x) => s / Math.sqrt(1 - x * x), mistakes: [{ f: (x) => -s / Math.sqrt(1 - x * x), msg: 'Sign check: arcsin has $+\\frac{1}{\\sqrt{1-x^2}}$, arccos has $-$.', tag: 'sign' }, { f: (x) => 1 / (1 + x * x), msg: 'That is the arctan derivative.', tag: 'derivative' }] },
      v: { expect: (x) => x, mistakes: [] },
      setupOpts: setupOptions(Ar.tex, 'x', duTex, ''),
      plugged, simplified,
      rest: { integralTex: restIntTex, resultTex: restR.tex, expect: restR.f, mistakes: [{ f: (x) => s * Math.sqrt(1 - x * x), msg: 'Sign: $dw = -2x\\,dx$ brings in a minus.', tag: 'sign' }, { f: (x) => (-s / 2) * Math.sqrt(1 - x * x), msg: '$\\int w^{-1/2}dw = 2w^{1/2}$, so the $-\\frac12$ and the 2 cancel to $-1$.', tag: 'power' }] },
      restTag: 'usub',
      answerTex: ans.tex,
      combineLine: `${uv.tex} - \\left(${restR.tex}\\right) = ${ans.tex} + C`,
    }),
  };
}

/* ---------- x · sec²x ---------- */
function x_sec2(level, r) {
  const X = pc.X(1);
  const Tn = pc.Trig('tan', 1), Sec2 = pc.Trig('sec', 1, 2);
  const lnCos = pc.Ln(M.P('\\cos x', 'cos(x)', Math.cos));
  const ans = S([T(1, [X, Tn]), T(1, [lnCos])]);
  const uv = S([T(1, [X, Tn])]);
  const restR = S([T(-1, [lnCos])]);
  const domain = [0.1, 1.3];
  const { plugged, simplified } = plugLines(`x\\,${Sec2.tex}`, 'x', '\\tan x', '1', '= x\\tan x - \\int \\tan x\\,dx');
  const mistakes = [
    mk(S([T(1, [X, Tn]), T(-1, [lnCos])]), 'trig-sign', '$\\int\\tan x\\,dx = -\\ln|\\cos x|$ (or $\\ln|\\sec x|$). Subtracting it gives $+\\ln|\\cos x|$.', 4),
    mk(uv, 'rounds', 'You stopped after $uv$.', 4),
    mk(S([T(1, [X, Tn]), T(-1, [pc.Trig('sec', 1, 2)])]), 'direction', '$\\int\\tan x\\,dx$ is a log, not $\\sec^2 x$ (that is the derivative of tan).', 4),
    mk(S([T(Q(1, 2), [pc.X(2), Tn])]), 'product', productHint, 0),
  ];
  return {
    family: 'x_sec2', famLabel: 'x · sec²x', level: 2,
    tex: `\\int x\\,${Sec2.tex}\\,dx`, f: (x) => x / Math.cos(x) ** 2, domain, absDomain: [1.9, 3.0], answer: ans, mistakes,
    hints: [
      'Algebra times trig: integration by parts.',
      '$u = x$, $dv = \\sec^2 x\\,dx$, so $v = \\tan x$.',
      '$\\int\\tan x\\,dx = -\\ln|\\cos x| = \\ln|\\sec x|$.',
    ],
    steps: ibpSteps({
      domain, integrandTex: `x\\,${Sec2.tex}`, uTex: 'x', dvTex: '\\sec^{2} x', duTex: '1', vTex: '\\tan x', vTag: 'trig-sign',
      uThink: 'LIATE: Algebraic before Trig. Plus, you know $\\int\\sec^2 x\\,dx$ by heart.',
      duThink: 'Differentiate $u = x$.',
      vThink: '$\\frac{d}{dx}\\tan x = \\sec^2 x$, so $\\int\\sec^2 x\\,dx = \\tan x$.',
      restThink: '$\\int\\tan x\\,dx = -\\ln|\\cos x|$. Memorize this one (or write $\\tan = \\frac{\\sin}{\\cos}$ and u-sub).',
      uOpts: [
        { tex: 'u = x', ok: true },
        { tex: 'u = \\sec^{2} x', msg: 'Then $v = \\frac{x^2}{2}$ and things get worse. Let $u = x$.' },
      ],
      du: { expect: () => 1, mistakes: [] },
      v: { expect: Math.tan, mistakes: [{ f: (x) => 1 / Math.cos(x) ** 3, msg: 'Not a power-rule situation. Which function has derivative $\\sec^2 x$?', tag: 'power' }] },
      setupOpts: setupOptions('x', '\\tan x', '1', '\\sec^{2} x'),
      plugged, simplified,
      rest: { integralTex: '\\int \\tan x\\,dx', resultTex: '-\\ln|\\cos x|', expect: restR.f, mistakes: [{ f: (x) => Math.log(Math.abs(Math.cos(x))), msg: 'Sign: $\\int\\tan x\\,dx = -\\ln|\\cos x|$.', tag: 'trig-sign' }, { f: (x) => 1 / Math.cos(x) ** 2, msg: 'That is the derivative of tan. We need its antiderivative.', tag: 'direction' }] },
      restTag: 'trig-sign',
      answerTex: ans.tex,
      combineLine: 'x\\tan x - \\left(-\\ln|\\cos x|\\right) = x\\tan x + \\ln|\\cos x| + C',
    }),
  };
}

/* ---------- tabular: x² · e^{ax}, x² · trig, x³ · e^{ax} ---------- */
function diTable(Ds, Is) {
  const rows = Ds.map((d, i) => `${i < Ds.length - 1 ? (i % 2 === 0 ? '+' : '-') : ''} & ${d} & ${Is[i]}`);
  return `\\begin{array}{c|c|c} \\text{sign} & D\\ (\\text{diff}) & I\\ (\\text{int}) \\\\ \\hline ${rows.join(' \\\\ ')} \\end{array}`;
}
function tabularSteps(o) {
  return [
    {
      title: 'Set up the D column',
      think: 'Tabular (DI) method: put the polynomial in D. It dies (hits 0) when you keep differentiating. Exponentials and sin/cos never die.',
      lines: [`D: ${o.Ds.join(' \\to ')}`],
      check: st.choice('Which goes in the D (differentiate) column?', [
        { tex: o.polyTex, ok: true },
        { tex: o.otherTex, msg: `$${o.otherTex}$ never reaches 0 when you differentiate. The polynomial does.` },
      ], 2),
      tag: 'liate',
    },
    {
      title: 'Start the I column',
      think: o.iThink,
      lines: [`\\int ${o.otherTex}\\,dx = ${o.I1Tex}`],
      check: st.expr(`\\int ${o.otherTex}\\,dx =`, { expect: o.I1f, exact: false, domain: o.domain, mistakes: o.I1Mist, points: 2, answerTex: o.I1Tex }),
      tag: 'kfactor',
    },
    {
      title: 'Fill the table, alternate signs',
      think: 'Keep integrating down the I column until D hits 0. Signs go $+, -, +, -, \\dots$ starting with $+$.',
      lines: [o.table],
      check: st.choice('What is the sign pattern for the diagonals?', [
        { text: o.signs, ok: true },
        { text: o.signs.replace(/−/g, '+'), msg: 'The signs alternate. Every other diagonal is negative.' },
        { text: o.signs.replace(/[+−]/g, (s) => (s === '+' ? '−' : '+')), msg: 'The pattern starts with $+$.' },
      ], 2),
      tag: 'sign',
    },
    {
      title: 'Multiply the diagonals',
      think: 'Each D entry times the I entry one row down, with that row\'s sign. Plug in fully, then simplify.',
      lines: [o.diagLine, `= ${o.answerTex} + C`],
      check: st.final(6),
      tag: 'rounds',
    },
  ];
}
function x2_exp(level, r, fx = {}) {
  const a = fx.a ?? r.pick([1, 2, -1, 3, -2]);
  const E = pc.E(a), X1 = pc.X(1), X2 = pc.X(2);
  const Ic = [Q(1), Q(1, a), Q(1, a * a), Q(1, a * a * a)];
  const ITex = Ic.map((c) => S([T(c, [E])]).tex);
  const ans = S([T(Q(1, a), [X2, E]), T(Q(-2, a * a), [X1, E]), T(Q(2, a * a * a), [E])]);
  const domain = [-1.0, 1.2];
  const mistakes = [
    mk(S([T(Q(1, a), [X2, E]), T(Q(2, a * a), [X1, E]), T(Q(2, a * a * a), [E])]), 'sign', 'The signs alternate: $+, -, +$. You used all plus.', 2),
    mk(S([T(Q(1, a), [X2, E]), T(Q(-2, a * a), [X1, E])]), 'rounds', 'You stopped one row early. $x^2$ takes two derivatives to become a constant, so there are 3 diagonals.', 3),
    a !== 1 && a !== -1 ? mk(S([T(Q(1, a), [X2, E]), T(Q(-2, a), [X1, E]), T(Q(2, a), [E])]), 'kfactor', `Each row of the I column divides by ${a} again: $\\frac{1}{${a}}, \\frac{1}{${a * a}}, \\frac{1}{${a * a * a}}$.`, 1) : null,
    mk(S([T(Q(1, 3 * a), [pc.X(3), E])]), 'product', productHint, 0),
  ];
  return {
    family: 'x2_exp', famLabel: 'x² · eᵃˣ', level: 2,
    tex: `\\int x^{2}\\,${E.tex}\\,dx`, f: (x) => x * x * Math.exp(a * x), domain, answer: ans, mistakes,
    hints: [
      '$x^2$ needs two rounds of parts. The tabular (DI) method does both at once.',
      `D column: $x^2 \\to 2x \\to 2 \\to 0$. I column: keep integrating $${E.tex}$.`,
      'Signs alternate $+,-,+$. Multiply each D entry by the I entry one row below it.',
    ],
    steps: tabularSteps({
      domain, polyTex: 'x^{2}', otherTex: E.tex, Ds: ['x^{2}', '2x', '2', '0'],
      iThink: a === 1 ? 'Integrate $e^{x}$: it stays $e^{x}$ every row.' : `Integrate $${E.tex}$: divide by ${a}.`,
      I1Tex: ITex[1], I1f: (x) => Math.exp(a * x) / a,
      I1Mist: a !== 1 ? [{ f: (x) => Math.exp(a * x), msg: `Divide by ${a}.`, tag: 'kfactor' }] : [],
      table: diTable(['x^{2}', '2x', '2', '0'], ITex),
      signs: '+ , − , +',
      diagLine: `(+)\\,(x^{2})${P(ITex[1])} + (-)\\,(2x)${P(ITex[2])} + (+)\\,(2)${P(ITex[3])}`,
      answerTex: ans.tex,
    }),
  };
}
function antiTrigTerm(c, name, a) { // ∫ c·name(ax) dx
  return name === 'sin' ? { c: Q.mul(c, Q(-1, a)), name: 'cos' } : { c: Q.mul(c, Q(1, a)), name: 'sin' };
}
function x2_trig(level, r, fx = {}) {
  const fn = fx.fn ?? r.pick(['sin', 'cos']);
  const a = fx.a ?? r.pick([1, 2, 1, 3]);
  const X1 = pc.X(1), X2 = pc.X(2);
  const I = [{ c: Q(1), name: fn }];
  for (let i = 0; i < 3; i++) I.push(antiTrigTerm(I[i].c, I[i].name, a));
  const ITex = I.map((t) => S([T(t.c, [pc.Trig(t.name, a)])]).tex);
  const coefs = [Q(1), Q(-2), Q(2)];
  const pows = [X2, X1, null];
  const ans = S([0, 1, 2].map((i) => T(Q.mul(coefs[i], I[i + 1].c), [pows[i], pc.Trig(I[i + 1].name, a)])));
  const allPlus = S([0, 1, 2].map((i) => T(Q.mul(Q.abs(coefs[i]), I[i + 1].c), [pows[i], pc.Trig(I[i + 1].name, a)])));
  // wrong integration rule (∫sin = +cos)
  const Iw = [{ c: Q(1), name: fn }];
  for (let i = 0; i < 3; i++) { const t = Iw[i]; Iw.push(t.name === 'sin' ? { c: Q.mul(t.c, Q(1, a)), name: 'cos' } : { c: Q.mul(t.c, Q(1, a)), name: 'sin' }); }
  const wrongRule = S([0, 1, 2].map((i) => T(Q.mul(coefs[i], Iw[i + 1].c), [pows[i], pc.Trig(Iw[i + 1].name, a)])));
  const domain = [-1.4, 1.5];
  const mistakes = [
    mk(allPlus, 'sign', 'The diagonal signs alternate $+,-,+$.', 2),
    mk(S(ans.terms.slice(0, 2)), 'rounds', 'One row short. $x^2$ needs 3 diagonals before D hits 0.', 3),
    mk(wrongRule, 'trig-sign', 'Sign slips in the I column. $\\int\\sin = -\\cos$ and $\\int\\cos = +\\sin$, every row.', 1),
    mk(S([T(Q.mul(Q(1, 3), I[1].c), [pc.X(3), pc.Trig(I[1].name, a)])]), 'product', productHint, 0),
  ];
  const antiRule = fn === 'sin' ? `-\\frac{1}{${a}}\\cos` : `\\frac{1}{${a}}\\sin`;
  return {
    family: 'x2_trig', famLabel: `x² · ${fn}(ax)`, level: 2,
    tex: `\\int x^{2}\\,${pc.Trig(fn, a).tex}\\,dx`, f: (x) => x * x * M.TRIGF[fn](a * x), domain, answer: ans, mistakes,
    hints: [
      '$x^2$ times trig: two rounds of parts. Use the DI table.',
      `D: $x^2 \\to 2x \\to 2 \\to 0$. I: keep integrating $${trigArg(fn, a)}$ (watch the signs: $\\int\\sin = -\\cos$).`,
      'Alternate $+,-,+$ along the diagonals.',
    ],
    steps: tabularSteps({
      domain, polyTex: 'x^{2}', otherTex: pc.Trig(fn, a).tex, Ds: ['x^{2}', '2x', '2', '0'],
      iThink: a === 1 ? `Integrate $${pc.Trig(fn, a).tex}$: sign check on every row.` : `Integrate $${pc.Trig(fn, a).tex}$: sign check, and divide by ${a}.`,
      I1Tex: ITex[1], I1f: (x) => (fn === 'sin' ? -Math.cos(a * x) / a : Math.sin(a * x) / a),
      I1Mist: [{ f: (x) => (fn === 'sin' ? Math.cos(a * x) / a : -Math.sin(a * x) / a), msg: `Sign: $\\int${trigArg(fn, a)}\\,dx = ${antiRule}(${ax(a)})$.`, tag: 'trig-sign' }],
      table: diTable(['x^{2}', '2x', '2', '0'], ITex),
      signs: '+ , − , +',
      diagLine: `(+)\\,(x^{2})${P(ITex[1])} + (-)\\,(2x)${P(ITex[2])} + (+)\\,(2)${P(ITex[3])}`,
      answerTex: ans.tex,
    }),
  };
}
function x3_exp(level, r, fx = {}) {
  const a = fx.a ?? r.pick([1, -1, 2]);
  const E = pc.E(a);
  const Ic = [1, 2, 3, 4].map((p) => Q(1, Math.pow(a, p)));
  const ITex = [E.tex].concat(Ic.map((c) => S([T(c, [E])]).tex));
  const D = [[1, 3], [-3, 2], [6, 1], [-6, 0]];
  const ans = S(D.map(([c, p], i) => T(Q.mul(Q(c), Ic[i]), [p ? pc.X(p) : null, E])));
  const allPlus = S(D.map(([c, p], i) => T(Q.mul(Q(Math.abs(c)), Ic[i]), [p ? pc.X(p) : null, E])));
  const noMult = S(D.map(([c, p], i) => T(Q.mul(Q(Math.sign(c)), Ic[i]), [p ? pc.X(p) : null, E])));
  const domain = [-0.9, 1.1];
  const mistakes = [
    mk(allPlus, 'sign', 'Signs alternate $+,-,+,-$.', 2),
    mk(S(ans.terms.slice(0, 3)), 'rounds', '$x^3$ needs 4 diagonals (it takes 3 derivatives to reach a constant).', 3),
    mk(noMult, 'derivative', 'The D column is $x^3 \\to 3x^2 \\to 6x \\to 6$. Keep the coefficients from differentiating.', 0),
  ];
  return {
    family: 'x3_exp', famLabel: 'x³ · eᵃˣ', level: 3,
    tex: `\\int x^{3}\\,${E.tex}\\,dx`, f: (x) => x ** 3 * Math.exp(a * x), domain, answer: ans, mistakes,
    hints: ['Three rounds of parts: definitely use the DI table.', 'D: $x^3 \\to 3x^2 \\to 6x \\to 6 \\to 0$.', 'Signs: $+,-,+,-$.'],
    steps: tabularSteps({
      domain, polyTex: 'x^{3}', otherTex: E.tex, Ds: ['x^{3}', '3x^{2}', '6x', '6', '0'],
      iThink: a === 1 ? 'Integrate $e^{x}$: it stays $e^{x}$ every row.' : `Integrate $${E.tex}$: divide by ${a}.`,
      I1Tex: ITex[1], I1f: (x) => Math.exp(a * x) / a,
      I1Mist: a !== 1 ? [{ f: (x) => Math.exp(a * x), msg: `Divide by ${a}.`, tag: 'kfactor' }] : [],
      table: diTable(['x^{3}', '3x^{2}', '6x', '6', '0'], ITex),
      signs: '+ , − , + , −',
      diagLine: `(+)(x^{3})${P(ITex[1])} + (-)(3x^{2})${P(ITex[2])} + (+)(6x)${P(ITex[3])} + (-)(6)${P(ITex[4])}`,
      answerTex: ans.tex,
    }),
  };
}

/* ---------- (ln x)² ---------- */
function ln2(level, r) {
  const X = pc.X(1), L = pc.LnX();
  const L2 = pc.Raw('(\\ln x)^{2}', 'ln(x)^2', (x) => Math.log(x) ** 2);
  const ans = S([T(1, [X, L2]), T(-2, [X, L]), T(2, [X])]);
  const domain = [0.4, 3.2];
  const restR = S([T(2, [X, L]), T(-2, [X])]);
  const mistakes = [
    mk(S([T(1, [X, L2]), T(-2, [X, L]), T(-2, [X])]), 'sign', 'Round 2: $-2\\int\\ln x\\,dx = -2(x\\ln x - x) = -2x\\ln x + 2x$. Distribute the minus to both terms.', 4),
    mk(S([T(1, [X, L2]), T(-2, [X, L])]), 'rounds', 'Round 2 is not finished: $\\int\\ln x\\,dx = x\\ln x - x$.', 4),
    mk(S([T(1, [X, L2]), T(2, [X, L]), T(-2, [X])]), 'formula-sign', 'The formula subtracts the second part.', 3),
    mk(S([T(Q(1, 3), [pc.Raw('(\\ln x)^{3}', 'ln(x)^3', (x) => Math.log(x) ** 3)])]), 'usub', 'That is $\\int\\frac{(\\ln x)^2}{x}dx$. Here there is no $\\frac1x$ to make a u-sub work.', null),
  ];
  const { plugged, simplified } = plugLines('(\\ln x)^{2}', '(\\ln x)^{2}', 'x', '\\frac{2\\ln x}{x}', '= x(\\ln x)^{2} - 2\\int \\ln x\\,dx');
  return {
    family: 'ln2', famLabel: '(ln x)²', level: 2,
    tex: '\\int (\\ln x)^{2}\\,dx', f: (x) => Math.log(x) ** 2, domain, answer: ans, mistakes,
    hints: ['Single function: $dv = dx$, $u = (\\ln x)^2$.', '$du = \\frac{2\\ln x}{x}dx$ (chain rule).', 'You will need $\\int\\ln x\\,dx = x\\ln x - x$ for round 2.'],
    steps: ibpSteps({
      domain, integrandTex: '(\\ln x)^{2}', uTex: '(\\ln x)^{2}', dvTex: '', duTex: '\\frac{2\\ln x}{x}', vTex: 'x',
      uThink: 'One function, so $dv = dx$ and $u$ is the log.',
      duThink: 'Chain rule: $\\frac{d}{dx}(\\ln x)^2 = 2\\ln x\\cdot\\frac{1}{x}$.',
      vThink: '$\\int dx = x$.',
      restThink: 'Round 2! $\\int\\ln x\\,dx = x\\ln x - x$, so double it.',
      uOpts: [{ tex: 'u = (\\ln x)^{2}', ok: true }, { tex: 'u = 1', msg: 'Then $v$ needs $\\int(\\ln x)^2$: the original problem.' }],
      du: { expect: (x) => (2 * Math.log(x)) / x, mistakes: [{ f: (x) => 2 * Math.log(x), msg: 'Chain rule: multiply by the derivative of the inside, $\\frac{1}{x}$.', tag: 'derivative' }] },
      v: { expect: (x) => x, mistakes: [] },
      setupOpts: setupOptions('(\\ln x)^{2}', 'x', '\\frac{2\\ln x}{x}', ''),
      plugged, simplified,
      rest: { integralTex: '2\\int \\ln x\\,dx', resultTex: restR.tex, expect: restR.f, mistakes: [{ f: (x) => 2 * x * Math.log(x) + 2 * x, msg: '$\\int\\ln x\\,dx = x\\ln x - x$ (minus!).', tag: 'sign' }] },
      restTag: 'rounds',
      answerTex: ans.tex,
      combineLine: `x(\\ln x)^{2} - \\left(${restR.tex}\\right) = ${ans.tex} + C`,
    }),
  };
}

/* ---------- boomerang: e^{ax} sin(bx), e^{ax} cos(bx) ---------- */
function exp_trig(level, r, fx = {}) {
  const fn = fx.fn ?? r.pick(['sin', 'cos']);
  const a = fx.a ?? r.pick([1, 2, -1, 1, 3]);
  const b = fx.b ?? r.pick([1, 2, 3, 1]);
  const E = pc.E(a), Sb = pc.Trig('sin', b), Cb = pc.Trig('cos', b);
  const D = a * a + b * b;
  const I = fn === 'sin' ? 'I' : 'J';
  const ans = fn === 'sin'
    ? S([T(Q(a, D), [E, Sb]), T(Q(-b, D), [E, Cb])])
    : S([T(Q(a, D), [E, Cb]), T(Q(b, D), [E, Sb])]);
  const forgot = fn === 'sin'
    ? S([T(Q(1, a), [E, Sb]), T(Q(-b, a * a), [E, Cb])])
    : S([T(Q(1, a), [E, Cb]), T(Q(b, a * a), [E, Sb])]);
  const wrongSign = fn === 'sin'
    ? S([T(Q(a, D), [E, Sb]), T(Q(b, D), [E, Cb])])
    : S([T(Q(a, D), [E, Cb]), T(Q(-b, D), [E, Sb])]);
  const domain = [-1.0, 1.2];
  const main = fn === 'sin' ? Sb : Cb, other = fn === 'sin' ? Cb : Sb;
  const vTex = S([T(Q(1, a), [E])]).tex;
  // b/a written as a positive-looking coefficient; sign carried separately
  const baQ = Q(b, a);
  const baAbs = Q.tex(Q.abs(baQ)) === '1' ? '' : Q.tex(Q.abs(baQ));
  const flip = (s) => (s === '-' ? '+' : '-');
  const neg = Q.sgn(baQ) < 0;
  const s1 = fn === 'sin' ? '-' : '+';
  const s2 = fn === 'sin' ? '+' : '-';
  const eff = (s) => (neg ? flip(s) : s);
  const r1f = (s) => `${I} = ${S([T(Q(1, a), [E, main])]).tex} ${eff(s)} ${baAbs}\\int ${E.tex}${other.tex}\\,dx`;
  const r2f = (s) => `\\int ${E.tex}${other.tex}\\,dx = ${S([T(Q(1, a), [E, other])]).tex} ${eff(s)} ${baAbs}\\,${I}`;
  const r1 = r1f(s1), r1bad = r1f(flip(s1));
  const r2 = r2f(s2), r2bad = r2f(flip(s2));
  const k = Q(b * b, a * a);
  const boom = `${I} = ${forgot.tex} - ${Q.tex(k) === '1' ? '' : Q.tex(k)}\\,${I}`;
  const mistakes = [
    mk(forgot, 'boomerang', `The integral came back. Move the $${Q.tex(k)}${I}$ to the left side and solve: $${I}\\left(1 + ${Q.tex(k)}\\right) = \\dots$`, 3),
    mk(wrongSign, 'sign', 'One sign slipped between round 1 and round 2. The $\\sin$ and $\\cos$ derivatives bring in a minus.', 2),
    mk(fn === 'sin' ? S([T(Q(-1, a * b), [E, Cb])]) : S([T(Q(1, a * b), [E, Sb])]), 'product', productHint, 0),
  ];
  return {
    family: 'exp_trig', famLabel: `eᵃˣ · ${fn}(bx)`, level: 3,
    tex: `\\int ${E.tex}${main.tex}\\,dx`, f: (x) => Math.exp(a * x) * M.TRIGF[fn](b * x), domain, answer: ans, mistakes,
    hints: [
      'The boomerang: parts twice, and the original integral comes back.',
      `Call the integral ${I}. Round 1: $u = ${main.tex}$, $dv = ${E.tex}dx$.`,
      `Round 2 (same choice of $u$ = trig) brings back ${I}. Then solve for ${I} like algebra.`,
    ],
    steps: [
      {
        title: 'Name it, start round 1', think: `Call the integral ${I}. Let $u = ${main.tex}$ and $dv = ${E.tex}dx$ (either split works, just keep the same type for both rounds).`,
        lines: [`u = ${main.tex},\\quad dv = ${E.tex}\\,dx,\\quad v = ${vTex}`],
        check: st.expr('v =', { expect: (x) => Math.exp(a * x) / a, exact: false, domain, mistakes: a !== 1 ? [{ f: (x) => Math.exp(a * x), msg: `Divide by ${a}.`, tag: 'kfactor' }] : [], points: 2, answerTex: vTex }),
        tag: 'kfactor',
      },
      {
        title: 'Round 1 result', think: `$du = ${fn === 'sin' ? `${b === 1 ? '' : b}\\cos(${ax(b)})` : `-${b === 1 ? '' : b}\\sin(${ax(b)})`}\\,dx$. Plug into $uv - \\int v\\,du$.`,
        lines: [r1],
        check: st.choice('Which is the round 1 result?', [{ tex: r1, ok: true }, { tex: r1bad, msg: 'Check the sign: the formula minus combines with the sign of $du$.' }], 2),
        tag: 'sign',
      },
      {
        title: 'Round 2: the integral comes back', think: `Same move on the new integral: $u$ = trig, $dv = ${E.tex}dx$. Watch for ${I} reappearing.`,
        lines: [r2, boom],
        check: st.choice('Which is the round 2 result?', [{ tex: r2, ok: true }, { tex: r2bad, msg: 'Sign check: the derivative of $\\cos$ is $-\\sin$, and the formula has its own minus.' }], 2),
        tag: 'sign',
      },
      {
        title: 'Solve for ' + I, think: `Add $${Q.tex(k)}\\,${I}$ to both sides: $${I}\\left(1 + ${Q.tex(k)}\\right) = \\dots$. What is the number multiplying ${I}?`,
        lines: [`${I}\\left(1 + ${Q.tex(k)}\\right) = ${forgot.tex}`, `${I}\\cdot ${Q.tex(Q(D, a * a))} = ${forgot.tex}`],
        check: st.num(`1 + ${Q.tex(k)} =`, D / (a * a), { points: 2, answerTex: Q.tex(Q(D, a * a)) }),
        tag: 'boomerang',
      },
      {
        title: 'Divide, then + C', think: `Multiply both sides by $${Q.tex(Q(a * a, D))}$. Then $+C$.`,
        lines: [`${I} = ${ans.tex} + C`],
        check: st.final(4),
        tag: 'algebra',
      },
    ],
  };
}

/* ---------- definite integrals (curated, exact answers) ---------- */
const E_ = Math.E, PI = Math.PI;
const DEFS = [
  { fam: x_exp, fx: { a: 1, k: 1 }, lo: ['0', 0], hi: ['1', 1], exact: '1', value: 1, plug: '\\left[x e^{x} - e^{x}\\right]_{0}^{1} = \\left(1\\cdot e^{1} - e^{1}\\right) - \\left(0\\cdot e^{0} - e^{0}\\right)' },
  { fam: x_trig, fx: { fn: 'sin', a: 1, k: 1 }, lo: ['0', 0], hi: ['\\pi', PI], exact: '\\pi', value: PI, plug: '\\left[-x\\cos x + \\sin x\\right]_{0}^{\\pi} = \\left(-\\pi\\cos\\pi + \\sin\\pi\\right) - \\left(-0\\cdot\\cos 0 + \\sin 0\\right)' },
  { fam: ln_ax, fx: { a: 1 }, lo: ['1', 1], hi: ['e', E_], exact: '1', value: 1, plug: '\\left[x\\ln x - x\\right]_{1}^{e} = \\left(e\\ln e - e\\right) - \\left(1\\cdot\\ln 1 - 1\\right)' },
  { fam: x_trig, fx: { fn: 'cos', a: 1, k: 1 }, lo: ['0', 0], hi: ['\\frac{\\pi}{2}', PI / 2], exact: '\\frac{\\pi}{2} - 1', value: PI / 2 - 1, plug: '\\left[x\\sin x + \\cos x\\right]_{0}^{\\pi/2} = \\left(\\tfrac{\\pi}{2}\\sin\\tfrac{\\pi}{2} + \\cos\\tfrac{\\pi}{2}\\right) - \\left(0\\cdot\\sin 0 + \\cos 0\\right)' },
  { fam: xn_ln, fx: { n: 1 }, lo: ['1', 1], hi: ['e', E_], exact: '\\frac{e^{2}+1}{4}', value: (E_ * E_ + 1) / 4, plug: '\\left[\\frac{x^{2}\\ln x}{2} - \\frac{x^{2}}{4}\\right]_{1}^{e} = \\left(\\frac{e^{2}\\ln e}{2} - \\frac{e^{2}}{4}\\right) - \\left(\\frac{1\\cdot\\ln 1}{2} - \\frac{1}{4}\\right)' },
  { fam: x_exp, fx: { a: 2, k: 1 }, lo: ['0', 0], hi: ['1', 1], exact: '\\frac{e^{2}+1}{4}', value: (E_ * E_ + 1) / 4, plug: '\\left[\\frac{1}{2}x e^{2x} - \\frac{1}{4}e^{2x}\\right]_{0}^{1} = \\left(\\frac{1}{2}e^{2} - \\frac{1}{4}e^{2}\\right) - \\left(0 - \\frac{1}{4}e^{0}\\right)' },
  { fam: x_trig, fx: { fn: 'cos', a: 1, k: 1 }, lo: ['0', 0], hi: ['\\pi', PI], exact: '-2', value: -2, plug: '\\left[x\\sin x + \\cos x\\right]_{0}^{\\pi} = \\left(\\pi\\sin\\pi + \\cos\\pi\\right) - \\left(0 + \\cos 0\\right)' },
  { fam: arctan_ax, fx: { a: 1 }, lo: ['0', 0], hi: ['1', 1], exact: '\\frac{\\pi}{4} - \\frac{1}{2}\\ln 2', value: PI / 4 - Math.log(2) / 2, plug: '\\left[x\\arctan x - \\tfrac{1}{2}\\ln(1+x^{2})\\right]_{0}^{1} = \\left(1\\cdot\\tfrac{\\pi}{4} - \\tfrac{1}{2}\\ln 2\\right) - \\left(0 - \\tfrac{1}{2}\\ln 1\\right)' },
  { fam: ln_ax, fx: { a: 1 }, lo: ['1', 1], hi: ['2', 2], exact: '2\\ln 2 - 1', value: 2 * Math.log(2) - 1, plug: '\\left[x\\ln x - x\\right]_{1}^{2} = \\left(2\\ln 2 - 2\\right) - \\left(1\\cdot\\ln 1 - 1\\right)' },
  { fam: x_trig, fx: { fn: 'sin', a: 1, k: 1 }, lo: ['0', 0], hi: ['\\frac{\\pi}{2}', PI / 2], exact: '1', value: 1, plug: '\\left[-x\\cos x + \\sin x\\right]_{0}^{\\pi/2} = \\left(-\\tfrac{\\pi}{2}\\cos\\tfrac{\\pi}{2} + \\sin\\tfrac{\\pi}{2}\\right) - \\left(0 + \\sin 0\\right)' },
  { fam: x2_exp, fx: { a: 1 }, lo: ['0', 0], hi: ['1', 1], exact: 'e - 2', value: E_ - 2, plug: '\\left[x^{2}e^{x} - 2xe^{x} + 2e^{x}\\right]_{0}^{1} = \\left(e - 2e + 2e\\right) - \\left(0 - 0 + 2\\right)' },
  { fam: exp_trig, fx: { fn: 'sin', a: 1, b: 1 }, lo: ['0', 0], hi: ['\\frac{\\pi}{2}', PI / 2], exact: '\\frac{e^{\\pi/2} + 1}{2}', value: (Math.exp(PI / 2) + 1) / 2, plug: '\\left[\\tfrac{1}{2}e^{x}\\sin x - \\tfrac{1}{2}e^{x}\\cos x\\right]_{0}^{\\pi/2} = \\left(\\tfrac{1}{2}e^{\\pi/2} - 0\\right) - \\left(0 - \\tfrac{1}{2}\\right)' },
  { fam: xn_ln, fx: { n: 2 }, lo: ['1', 1], hi: ['e', E_], exact: '\\frac{2e^{3}+1}{9}', value: (2 * E_ ** 3 + 1) / 9, plug: '\\left[\\frac{x^{3}\\ln x}{3} - \\frac{x^{3}}{9}\\right]_{1}^{e} = \\left(\\frac{e^{3}}{3} - \\frac{e^{3}}{9}\\right) - \\left(0 - \\frac{1}{9}\\right)' },
  { fam: x_exp, fx: { a: -1, k: 1 }, lo: ['0', 0], hi: ['1', 1], exact: '1 - \\frac{2}{e}', value: 1 - 2 / E_, plug: '\\left[-x e^{-x} - e^{-x}\\right]_{0}^{1} = \\left(-e^{-1} - e^{-1}\\right) - \\left(0 - e^{0}\\right)' },
];
M.IBP_DEFS = DEFS;
function definite(level, r, fx = {}) {
  const d = fx.def ?? r.pick(DEFS);
  const base = d.fam(level, r, d.fx);
  const integrand = base.tex.replace(/^\\int /, '');
  const steps = base.steps.slice();
  const last = steps[steps.length - 1];
  steps[steps.length - 1] = { ...last, title: 'Antiderivative (no +C needed)', think: 'For a definite integral, find any antiderivative. The $+C$ cancels when you subtract.', check: st.expr('F(x) =', { expect: base.answer.f, exact: false, domain: base.domain, mistakes: (base.mistakes || []).map((m) => ({ f: m.f, msg: m.msg, tag: m.tag })), points: 3, answerTex: base.answer.tex }) };
  steps.push({
    title: 'Evaluate top minus bottom', think: 'Plug in the top limit, plug in the bottom limit, subtract. Write both plugged in fully before you simplify. Keep it exact (no decimals).',
    lines: [d.plug, `= ${d.exact}`],
    check: st.num(`\\int_{${d.lo[0]}}^{${d.hi[0]}} \\cdots = `, d.value, { points: 3, answerTex: d.exact, exactNote: true }),
    tag: 'exact',
  });
  return {
    ...base,
    family: 'definite', famLabel: 'definite', level: Math.max(2, base.level),
    tex: `\\int_{${d.lo[0]}}^{${d.hi[0]}} ${integrand}`,
    definite: { lo: d.lo, hi: d.hi, exact: d.exact, value: d.value, plug: d.plug, F: base.answer.f },
    steps, noMC: true,
    hints: base.hints.concat([`Then evaluate $F(${d.hi[0]}) - F(${d.lo[0]})$ and keep it exact.`]),
  };
}

const FAM = { x_exp, x_trig, ln_ax, xn_ln, arctan: arctan_ax, arcsin: arcsin_x, x_sec2, x2_exp, x2_trig, x3_exp, ln2, exp_trig, definite };
M.IBP_FAMILIES = FAM;
const BY_LEVEL = {
  1: [[x_exp, 4], [x_trig, 4], [ln_ax, 2], [xn_ln, 3], [arctan_ax, 1], [arcsin_x, 1]],
  2: [[x2_exp, 3], [x2_trig, 3], [ln2, 1], [x_sec2, 1], [definite, 2], [xn_ln, 1], [x_trig, 1]],
  3: [[exp_trig, 4], [x3_exp, 2], [definite, 2], [x2_trig, 2], [arctan_ax, 1], [ln2, 1]],
};
M.GEN.ibp = function (level, r, family) {
  const fam = family ? FAM[family] : r.pickW(BY_LEVEL[level] || BY_LEVEL[1]);
  const p = fam(level, r);
  p.level = level;
  return p;
};
})(typeof globalThis !== 'undefined' ? globalThis : this);
