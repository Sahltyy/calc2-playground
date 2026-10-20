/* ==========================================================================
   UNIT 3 — Trigonometric Substitution
   ========================================================================== */
(function (G) {
'use strict';
const M = G.M, Q = M.Q, T = M.term, S = M.sum, pc = M.pc, st = M.st;
const mk = M.mistake;
const ca = (a, s) => (a === 1 ? s : `${a}${s}`);
const TH = [0.15, 1.2]; // θ sampling window
const sec = (t) => 1 / Math.cos(t);

const FORM = {
  sin: {
    sub: (a) => `x = ${ca(a, '\\sin\\theta')}`, dxTex: (a) => ca(a, '\\cos\\theta'), dxf: (a) => (t) => a * Math.cos(t),
    radTex: (a) => ca(a, '\\cos\\theta'), radf: (a) => (t) => a * Math.cos(t), pyth: '1-\\sin^{2}\\theta = \\cos^{2}\\theta',
    shape: (a2) => `\\sqrt{${a2}-x^{2}}`, xf: (a) => (t) => a * Math.sin(t),
    tri: (a, a2) => ({ opp: 'x', adj: `\\sqrt{${a2}-x^{2}}`, hyp: `${a}` }), which: 'a^{2} - x^{2}',
  },
  tan: {
    sub: (a) => `x = ${ca(a, '\\tan\\theta')}`, dxTex: (a) => ca(a, '\\sec^{2}\\theta'), dxf: (a) => (t) => a * sec(t) ** 2,
    radTex: (a) => ca(a, '\\sec\\theta'), radf: (a) => (t) => a * sec(t), pyth: '1+\\tan^{2}\\theta = \\sec^{2}\\theta',
    shape: (a2) => `\\sqrt{${a2}+x^{2}}`, xf: (a) => (t) => a * Math.tan(t),
    tri: (a, a2) => ({ opp: 'x', adj: `${a}`, hyp: `\\sqrt{x^{2}+${a2}}` }), which: 'a^{2} + x^{2}',
  },
  sec: {
    sub: (a) => `x = ${ca(a, '\\sec\\theta')}`, dxTex: (a) => ca(a, '\\sec\\theta\\tan\\theta'), dxf: (a) => (t) => a * sec(t) * Math.tan(t),
    radTex: (a) => ca(a, '\\tan\\theta'), radf: (a) => (t) => a * Math.tan(t), pyth: '\\sec^{2}\\theta - 1 = \\tan^{2}\\theta',
    shape: (a2) => `\\sqrt{x^{2}-${a2}}`, xf: (a) => (t) => a * sec(t),
    tri: (a, a2) => ({ opp: `\\sqrt{x^{2}-${a2}}`, adj: `${a}`, hyp: 'x' }), which: 'x^{2} - a^{2}',
  },
};
function subChoice(form, a) {
  const msgs = {
    sin: '$x = a\\sin\\theta$ is for $a^2 - x^2$ (number minus $x^2$).',
    tan: '$x = a\\tan\\theta$ is for $a^2 + x^2$ (plus).',
    sec: '$x = a\\sec\\theta$ is for $x^2 - a^2$ ($x^2$ first, minus a number).',
  };
  return st.choice('Which substitution?', ['sin', 'tan', 'sec'].map((k) => (k === form ? { tex: FORM[k].sub(a), ok: true } : { tex: FORM[k].sub(a), msg: msgs[k] })), 2);
}
function dxMistakes(form, a) {
  const out = [];
  if (form === 'sin') {
    out.push({ f: (t) => -a * Math.cos(t), msg: '$\\frac{d}{d\\theta}\\sin\\theta = +\\cos\\theta$.', tag: 'trig-sign' });
    out.push({ f: (t) => a * Math.sin(t), msg: 'Differentiate: $\\sin\\theta \\to \\cos\\theta$.', tag: 'derivative' });
    if (a !== 1) out.push({ f: (t) => Math.cos(t), msg: `Keep the ${a} in front: $dx = ${a}\\cos\\theta\\,d\\theta$.`, tag: 'kfactor' });
  } else if (form === 'tan') {
    out.push({ f: (t) => a * sec(t) * Math.tan(t), msg: 'That is the derivative of $\\sec$. $\\frac{d}{d\\theta}\\tan\\theta = \\sec^2\\theta$.', tag: 'derivative' });
    if (a !== 1) out.push({ f: (t) => sec(t) ** 2, msg: `Keep the ${a}: $dx = ${a}\\sec^2\\theta\\,d\\theta$.`, tag: 'kfactor' });
  } else {
    out.push({ f: (t) => a * sec(t) ** 2, msg: 'That is the derivative of $\\tan$. $\\frac{d}{d\\theta}\\sec\\theta = \\sec\\theta\\tan\\theta$.', tag: 'derivative' });
    if (a !== 1) out.push({ f: (t) => sec(t) * Math.tan(t), msg: `Keep the ${a}: $dx = ${a}\\sec\\theta\\tan\\theta\\,d\\theta$.`, tag: 'kfactor' });
  }
  return out;
}
function radLine(form, a, a2) {
  if (form === 'sin') return `\\sqrt{${a2}-x^{2}} = \\sqrt{${a2}-${ca(a2, '\\sin^{2}\\theta')}} = \\sqrt{${a2}(1-\\sin^{2}\\theta)} = \\sqrt{${ca(a2, '\\cos^{2}\\theta')}} = ${ca(a, '\\cos\\theta')}`;
  if (form === 'tan') return `\\sqrt{${a2}+x^{2}} = \\sqrt{${a2}+${ca(a2, '\\tan^{2}\\theta')}} = \\sqrt{${a2}(1+\\tan^{2}\\theta)} = \\sqrt{${ca(a2, '\\sec^{2}\\theta')}} = ${ca(a, '\\sec\\theta')}`;
  return `\\sqrt{x^{2}-${a2}} = \\sqrt{${ca(a2, '\\sec^{2}\\theta')}-${a2}} = \\sqrt{${a2}(\\sec^{2}\\theta-1)} = \\sqrt{${ca(a2, '\\tan^{2}\\theta')}} = ${ca(a, '\\tan\\theta')}`;
}
function radMistakes(form, a) {
  const F = FORM[form];
  const g = F.radf(a);
  const out = [{ f: (t) => g(t) ** 2, msg: 'Take the square root at the end: $\\sqrt{a^2\\cos^2\\theta} = a\\cos\\theta$ (same idea for sec, tan).', tag: 'algebra' }];
  if (form === 'sin') out.push({ f: (t) => a * Math.sin(t), msg: `$1 - \\sin^2\\theta = \\cos^2\\theta$, so the root is $${ca(a, '\\cos\\theta')}$.`, tag: 'identity' });
  if (form === 'tan') out.push({ f: (t) => a * Math.tan(t), msg: `$1 + \\tan^2\\theta = \\sec^2\\theta$, so the root is $${ca(a, '\\sec\\theta')}$.`, tag: 'identity' });
  if (form === 'sec') out.push({ f: (t) => a * sec(t), msg: `$\\sec^2\\theta - 1 = \\tan^2\\theta$, so the root is $${ca(a, '\\tan\\theta')}$.`, tag: 'identity' });
  return out;
}

/** Build the 7-step trig-sub walkthrough. */
function build(o) {
  const { form, a } = o;
  const a2 = a * a;
  const F = FORM[form];
  const tri = o.tri || F.tri(a, a2);
  const steps = [
    { title: 'Spot the shape', think: `The pattern ${o.shapeNote || `$${F.shape(a2)}$`} is ${form === 'sin' ? 'number minus $x^2$' : form === 'tan' ? 'number plus $x^2$' : '$x^2$ minus number'}, with $a = ${a}$ (since $a^2 = ${a2}$). Pick the substitution whose Pythagorean identity cancels the radical: $${F.pyth}$.`, lines: [`${F.sub(a)}`], check: subChoice(form, a), tag: 'tsub-form' },
    { title: 'Find dx', think: `Differentiate $${F.sub(a)}$ with respect to $\\theta$.`, lines: [`dx = ${F.dxTex(a)}\\,d\\theta`], check: st.expr('dx =', { vars: ['θ'], suffixTex: '\\,d\\theta', expect: F.dxf(a), exact: true, domain: TH, mistakes: dxMistakes(form, a), points: 2, answerTex: F.dxTex(a) }), tag: 'derivative' },
    o.radStep || { title: 'Kill the radical', think: `Plug $${F.sub(a)}$ into the radical, factor out ${a2}, use $${F.pyth}$, take the root.`, lines: [radLine(form, a, a2)], check: st.expr(`${F.shape(a2)} =`, { vars: ['θ'], expect: F.radf(a), exact: true, domain: TH, mistakes: radMistakes(form, a), points: 2, answerTex: F.radTex(a) }), tag: 'identity' },
    { title: 'Plug everything in', think: 'Replace every piece (the $x$\'s, the radical, and $dx$) with its $\\theta$ version, in parentheses. Then cancel.', lines: o.plugLines, check: null, tag: 'algebra' },
    { title: 'Integrate in θ', think: o.thetaThink, lines: [`${o.thetaIntTex} = ${o.Gtex}`], check: st.expr(`${o.thetaIntTex} =`, { vars: ['θ'], expect: o.Gf, exact: false, domain: TH, mistakes: o.Gmist || [], points: 2, answerTex: o.Gtex }), tag: o.thetaTag || 'trig-sign' },
    { title: 'Back to x with the triangle', think: `From $${F.sub(a)}$: $\\${form}\\theta = ${form === 'sin' ? `\\frac{x}{${a}}` : form === 'tan' ? `\\frac{x}{${a}}` : `\\frac{x}{${a}}`}$. Label the triangle (SOH CAH TOA) and read off what you need.`, lines: o.triLines, check: st.choice(o.triPrompt, o.triOptions, 2), tag: 'triangle', triangle: { form, ...tri } },
    { title: 'Final answer + C', think: 'Swap every $\\theta$-expression for its $x$ version. Constants like $-\\ln a$ can be absorbed into $C$.', lines: o.answerLines, check: st.final(2), tag: 'backsub' },
  ];
  return {
    family: o.family, famLabel: o.famLabel, level: o.level,
    tex: o.tex, f: o.f, domain: o.domain, absDomain: o.absDomain, answer: o.answer, mistakes: o.mistakes,
    hints: o.hints, steps, triangle: { form, ...tri }, form, a,
  };
}
const xa = (a) => (a === 1 ? M.P('x', 'x', (x) => x) : M.P(`\\frac{x}{${a}}`, `x/${a}`, (x) => x / a));
const ratio = (num, den) => `\\frac{${num}}{${den}}`;

/* S1: ∫ dx / √(a² − x²) */
function asin_basic(level, r, fx = {}) {
  const a = fx.a ?? r.pick([1, 2, 3, 4, 5]); const a2 = a * a;
  const ans = S([T(1, [pc.Arc('arcsin', xa(a))])]);
  const domain = [-0.8 * a, 0.85 * a];
  return build({
    form: 'sin', a, family: 'asin', famLabel: '1/√(a²−x²)', level: 1,
    tex: `\\int \\frac{dx}{\\sqrt{${a2}-x^{2}}}`, f: (x) => 1 / Math.sqrt(a2 - x * x), domain, answer: ans,
    plugLines: [`\\int \\frac{${FORM.sin.dxTex(a)}\\,d\\theta}{${ca(a, '\\cos\\theta')}} = \\int d\\theta`],
    thetaIntTex: '\\int d\\theta', Gtex: '\\theta', Gf: (t) => t, thetaThink: 'Everything cancels! $\\int d\\theta = \\theta$.', thetaTag: 'algebra',
    triLines: [`\\sin\\theta = \\frac{x}{${a}} \\;\\Rightarrow\\; \\theta = \\arcsin\\left(\\frac{x}{${a}}\\right)`], triPrompt: '$\\theta = \\;?$',
    triOptions: [{ tex: `\\arcsin\\left(\\frac{x}{${a}}\\right)`, ok: true }, { tex: `\\arccos\\left(\\frac{x}{${a}}\\right)`, msg: `$x = ${a}\\sin\\theta$ means $\\sin\\theta = \\frac{x}{${a}}$, so arcsin.` }, { tex: `\\arctan\\left(\\frac{x}{${a}}\\right)`, msg: 'arctan goes with the tan substitution.' }, ...(a !== 1 ? [{ tex: `\\arcsin\\left(\\frac{${a}}{x}\\right)`, msg: `$\\sin\\theta = \\frac{\\text{opp}}{\\text{hyp}} = \\frac{x}{${a}}$.` }] : [])],
    answerLines: [`\\int \\frac{dx}{\\sqrt{${a2}-x^{2}}} = ${ans.tex} + C`],
    mistakes: [
      a !== 1 ? mk(S([T(1, [pc.Arc('arcsin', xa(1))])]), 'triangle', `$\\theta = \\arcsin\\left(\\frac{x}{${a}}\\right)$. Divide by ${a} inside.`, 5) : null,
      mk(S([T(1, [pc.Arc('arccos', xa(a))])]), 'sign', 'arccos has a negative derivative. From $x = a\\sin\\theta$ you get arcsin.', 5),
      mk(S([T(1, [pc.Arc('arctan', xa(a))])]), 'tsub-form', 'arctan comes from $a^2 + x^2$. This is $a^2 - x^2$.', 0),
      a !== 1 ? mk(S([T(Q(1, a), [pc.Arc('arcsin', xa(a))])]), 'kfactor', `Here the ${a}'s cancel completely: $\\frac{${a}\\cos\\theta}{${a}\\cos\\theta} = 1$.`, 4) : null,
    ],
    hints: [`$\\sqrt{${a2}-x^2}$: number minus $x^2$, so $x = ${ca(a, '\\sin\\theta')}$.`, 'Everything cancels to $\\int d\\theta$.', `$\\theta = \\arcsin\\left(\\frac{x}{${a}}\\right)$. (This one is also a formula worth memorizing.)`],
  });
}

/* S2: ∫ dx / (a² + x²) */
function atan_basic(level, r, fx = {}) {
  const a = fx.a ?? r.pick([1, 2, 3, 4, 5]); const a2 = a * a;
  const ans = S([T(Q(1, a), [pc.Arc('arctan', xa(a))])]);
  const domain = [-2.5, 3];
  const p = build({
    form: 'tan', a, family: 'atan', famLabel: '1/(a²+x²)', level: 1,
    tex: `\\int \\frac{dx}{${a2}+x^{2}}`, f: (x) => 1 / (a2 + x * x), domain, answer: ans,
    radStep: { title: 'Simplify the bottom', think: `Plug in $x = ${ca(a, '\\tan\\theta')}$, factor out ${a2}, use $1 + \\tan^2\\theta = \\sec^2\\theta$. (No root here.)`, lines: [`${a2}+x^{2} = ${a2}+${ca(a2, '\\tan^{2}\\theta')} = ${a2}(1+\\tan^{2}\\theta) = ${ca(a2, '\\sec^{2}\\theta')}`], check: st.expr(`${a2}+x^{2} =`, { vars: ['θ'], expect: (t) => a2 * sec(t) ** 2, exact: true, domain: TH, mistakes: [{ f: (t) => a * sec(t), msg: 'There is no square root in this problem, so keep the square.', tag: 'algebra' }, { f: (t) => a2 * Math.tan(t) ** 2, msg: '$1 + \\tan^2\\theta = \\sec^2\\theta$.', tag: 'identity' }], points: 2, answerTex: ca(a2, '\\sec^{2}\\theta') }), tag: 'identity' },
    plugLines: [`\\int \\frac{${FORM.tan.dxTex(a)}\\,d\\theta}{${ca(a2, '\\sec^{2}\\theta')}} = ${a === 1 ? '' : `\\frac{1}{${a}}`}\\int d\\theta`],
    thetaIntTex: `${a === 1 ? '' : `\\frac{1}{${a}}`}\\int d\\theta`, Gtex: a === 1 ? '\\theta' : `\\frac{\\theta}{${a}}`, Gf: (t) => t / a, thetaThink: `The $\\sec^2$ cancels and leaves $\\frac{${a}}{${a2}} = \\frac{1}{${a}}$.`, thetaTag: 'kfactor',
    Gmist: a !== 1 ? [{ f: (t) => t, msg: `Keep the $\\frac{1}{${a}}$ out front.`, tag: 'kfactor' }] : [],
    triLines: [`\\tan\\theta = \\frac{x}{${a}} \\;\\Rightarrow\\; \\theta = \\arctan\\left(\\frac{x}{${a}}\\right)`], triPrompt: '$\\theta = \\;?$',
    triOptions: [{ tex: `\\arctan\\left(\\frac{x}{${a}}\\right)`, ok: true }, { tex: `\\arcsin\\left(\\frac{x}{${a}}\\right)`, msg: 'From $x = a\\tan\\theta$ you get arctan.' }, ...(a !== 1 ? [{ tex: `\\arctan\\left(\\frac{${a}}{x}\\right)`, msg: `$\\tan\\theta = \\frac{x}{${a}}$ (opposite over adjacent).` }] : [{ tex: '\\operatorname{arcsec} x', msg: 'From $x = \\tan\\theta$ you get arctan.' }])],
    answerLines: [`\\int \\frac{dx}{${a2}+x^{2}} = ${ans.tex} + C`],
    mistakes: [
      a !== 1 ? mk(S([T(1, [pc.Arc('arctan', xa(a))])]), 'kfactor', `There is a $\\frac{1}{${a}}$ out front: $\\frac{${a}\\sec^2\\theta}{${a2}\\sec^2\\theta} = \\frac{1}{${a}}$.`, 4) : null,
      a !== 1 ? mk(S([T(Q(1, a), [pc.Arc('arctan', xa(1))])]), 'triangle', `$\\theta = \\arctan\\left(\\frac{x}{${a}}\\right)$, not $\\arctan x$.`, 5) : null,
      a !== 1 ? mk(S([T(a, [pc.Arc('arctan', xa(a))])]), 'kfactor', `It is $\\frac{1}{${a}}$, not ${a}.`, 4) : null,
      mk(S([T(Q(1, 2), [pc.Ln(M.P(`${a2}+x^{2}`, `${a2}+x^2`, (x) => a2 + x * x), false)])]), 'usub', 'A $\\ln$ would need an $x$ on top (u-sub). With just $dx$ on top it is arctan.', null),
    ],
    hints: [`Number plus $x^2$: $x = ${ca(a, '\\tan\\theta')}$.`, `The bottom becomes $${ca(a2, '\\sec^2\\theta')}$, which cancels with $dx$.`, `Formula to memorize: $\\int\\frac{dx}{a^2+x^2} = \\frac{1}{a}\\arctan\\frac{x}{a}$.`],
  });
  return p;
}

/* S3: ∫ dx / √(a² + x²) */
function ln_plus(level, r, fx = {}) {
  const a = fx.a ?? r.pick([1, 2, 3, 4]); const a2 = a * a;
  const L = pc.Raw(`\\ln\\left|x + \\sqrt{x^{2}+${a2}}\\right|`, `ln(abs(x+sqrt(x^2+${a2})))`, (x) => Math.log(Math.abs(x + Math.sqrt(x * x + a2))));
  const ans = S([T(1, [L])]);
  const domain = [-2.5, 3];
  return build({
    form: 'tan', a, family: 'ln_plus', famLabel: '1/√(a²+x²)', level: 2,
    tex: `\\int \\frac{dx}{\\sqrt{${a2}+x^{2}}}`, f: (x) => 1 / Math.sqrt(a2 + x * x), domain, answer: ans,
    plugLines: [`\\int \\frac{${FORM.tan.dxTex(a)}\\,d\\theta}{${ca(a, '\\sec\\theta')}} = \\int \\sec\\theta\\,d\\theta`],
    thetaIntTex: '\\int \\sec\\theta\\,d\\theta', Gtex: '\\ln|\\sec\\theta + \\tan\\theta|', Gf: (t) => Math.log(Math.abs(sec(t) + Math.tan(t))), thetaThink: 'Memorized: $\\int\\sec\\theta\\,d\\theta = \\ln|\\sec\\theta + \\tan\\theta|$.', thetaTag: 'trig-sign',
    Gmist: [{ f: (t) => Math.log(Math.abs(sec(t))), msg: 'That is $\\int\\tan\\theta$. For $\\sec$: $\\ln|\\sec\\theta + \\tan\\theta|$.', tag: 'usub' }, { f: (t) => sec(t) * Math.tan(t), msg: 'That is the derivative of $\\sec$.', tag: 'direction' }],
    triLines: [`\\sec\\theta = \\frac{\\sqrt{x^{2}+${a2}}}{${a}},\\quad \\tan\\theta = \\frac{x}{${a}}`, `\\sec\\theta + \\tan\\theta = \\frac{\\sqrt{x^{2}+${a2}} + x}{${a}}`],
    triPrompt: '$\\sec\\theta + \\tan\\theta = \\;?$',
    triOptions: [{ tex: ratio(`\\sqrt{x^{2}+${a2}} + x`, a), ok: true }, { tex: ratio(`x + ${a}`, `\\sqrt{x^{2}+${a2}}`), msg: '$\\sec = \\frac{\\text{hyp}}{\\text{adj}}$ and $\\tan = \\frac{\\text{opp}}{\\text{adj}}$. Both have the same bottom.' }, { tex: ratio(`\\sqrt{x^{2}+${a2}} + ${a}`, 'x'), msg: `Adjacent is ${a}, opposite is $x$.` }],
    answerLines: [`\\ln\\left|\\frac{\\sqrt{x^{2}+${a2}} + x}{${a}}\\right| = \\ln\\left|x + \\sqrt{x^{2}+${a2}}\\right| ${a === 1 ? '' : `- \\ln ${a}`}`, `= ${ans.tex} + C`],
    mistakes: [
      mk(S([T(1, [pc.Arc('arctan', xa(a))])]), 'tsub-form', 'arctan comes from $\\int\\frac{dx}{a^2+x^2}$ (no root). With the root you get $\\int\\sec\\theta$.', 4),
      a !== 1 ? mk(S([T(Q(1, a), [L])]), 'kfactor', `The ${a}'s cancel: $\\frac{${a}\\sec^2\\theta}{${a}\\sec\\theta} = \\sec\\theta$.`, 3) : null,
      mk(S([T(1, [pc.Sqrt(M.P(`x^{2}+${a2}`, `x^2+${a2}`, (x) => x * x + a2))])]), 'usub', 'That would be $\\int\\frac{x\\,dx}{\\sqrt{x^2+a^2}}$ (a u-sub with $x$ on top).', null),
    ],
    hints: [`Number plus $x^2$ under a root: $x = ${ca(a, '\\tan\\theta')}$.`, 'You get $\\int\\sec\\theta\\,d\\theta = \\ln|\\sec\\theta+\\tan\\theta|$.', 'Triangle: opposite $x$, adjacent $a$, hypotenuse $\\sqrt{x^2+a^2}$.'],
  });
}

/* S4: ∫ dx / √(x² − a²) */
function ln_minus(level, r, fx = {}) {
  const a = fx.a ?? r.pick([1, 2, 3, 4]); const a2 = a * a;
  const rt = (x) => Math.sqrt(x * x - a2);
  const L = pc.Raw(`\\ln\\left|x + \\sqrt{x^{2}-${a2}}\\right|`, `ln(abs(x+sqrt(x^2-${a2})))`, (x) => Math.log(Math.abs(x + rt(x))));
  const ans = S([T(1, [L])]);
  const domain = [1.2 * a, 3 * a];
  return build({
    form: 'sec', a, family: 'ln_minus', famLabel: '1/√(x²−a²)', level: 2,
    tex: `\\int \\frac{dx}{\\sqrt{x^{2}-${a2}}}`, f: (x) => 1 / rt(x), domain, answer: ans,
    plugLines: [`\\int \\frac{${FORM.sec.dxTex(a)}\\,d\\theta}{${ca(a, '\\tan\\theta')}} = \\int \\sec\\theta\\,d\\theta`],
    thetaIntTex: '\\int \\sec\\theta\\,d\\theta', Gtex: '\\ln|\\sec\\theta + \\tan\\theta|', Gf: (t) => Math.log(Math.abs(sec(t) + Math.tan(t))), thetaThink: 'Memorized: $\\int\\sec\\theta\\,d\\theta = \\ln|\\sec\\theta + \\tan\\theta|$.', thetaTag: 'trig-sign',
    Gmist: [{ f: (t) => Math.log(Math.abs(sec(t))), msg: 'That is $\\int\\tan\\theta$. For $\\sec$: $\\ln|\\sec\\theta + \\tan\\theta|$.', tag: 'usub' }],
    triLines: [`\\sec\\theta = \\frac{x}{${a}},\\quad \\tan\\theta = \\frac{\\sqrt{x^{2}-${a2}}}{${a}}`],
    triPrompt: '$\\sec\\theta + \\tan\\theta = \\;?$',
    triOptions: [{ tex: ratio(`x + \\sqrt{x^{2}-${a2}}`, a), ok: true }, { tex: ratio(`${a} + \\sqrt{x^{2}-${a2}}`, 'x'), msg: `$\\sec = \\frac{\\text{hyp}}{\\text{adj}} = \\frac{x}{${a}}$.` }, { tex: ratio(`x + ${a}`, `\\sqrt{x^{2}-${a2}}`), msg: 'Both ratios have the adjacent side on the bottom.' }],
    answerLines: [`\\ln\\left|\\frac{x + \\sqrt{x^{2}-${a2}}}{${a}}\\right| = ${ans.tex}${a === 1 ? '' : ` - \\ln ${a}`}`, `= ${ans.tex} + C`],
    mistakes: [
      mk(S([T(Q(1, a), [pc.Arc('arcsec', xa(a))])]), 'tsub-form', 'arcsec shows up for $\\int\\frac{dx}{x\\sqrt{x^2-a^2}}$. Here you get $\\int\\sec\\theta$.', 4),
      mk(S([T(1, [pc.Raw(`\\ln\\left|x - \\sqrt{x^{2}-${a2}}\\right|`, `ln(abs(x-sqrt(x^2-${a2})))`, (x) => Math.log(Math.abs(x - rt(x))))])]), 'sign', 'Plus inside: $\\sec\\theta + \\tan\\theta$.', 5),
      mk(S([T(1, [pc.Sqrt(M.P(`x^{2}-${a2}`, `x^2-${a2}`, (x) => x * x - a2))])]), 'usub', 'That is $\\int\\frac{x\\,dx}{\\sqrt{x^2-a^2}}$ (u-sub, needs an $x$ on top).', null),
    ],
    hints: [`$x^2$ minus a number: $x = ${ca(a, '\\sec\\theta')}$.`, 'You get $\\int\\sec\\theta\\,d\\theta$.', 'Triangle: hypotenuse $x$, adjacent $a$, opposite $\\sqrt{x^2-a^2}$.'],
  });
}

/* S5 & S7: ∫ √(a²−x²) dx  and  ∫ x²/√(a²−x²) dx */
function sqrt_area(level, r, fx = {}) {
  const which = fx.which ?? r.pick(['plain', 'plain', 'x2']);
  const a = fx.a ?? r.pick([1, 2, 3, 4, 5]); const a2 = a * a;
  const s = which === 'plain' ? 1 : -1; // + for √(a²−x²) (cos²), − for x²/√ (sin²)
  const root = pc.Sqrt(M.P(`${a2}-x^{2}`, `${a2}-x^2`, (x) => a2 - x * x));
  const As = pc.Arc('arcsin', xa(a));
  const ans = S([T(Q(a2, 2), [As]), T(Q(s, 2), [pc.X(1), root])]);
  const domain = [-0.8 * a, 0.85 * a];
  const thInt = `${ca(a2, which === 'plain' ? '\\int\\cos^{2}\\theta\\,d\\theta' : '\\int\\sin^{2}\\theta\\,d\\theta')}`;
  const Gtex = S([T(Q(a2, 2), [pc.Raw('\\theta', 'theta', (t) => t)]), T(Q(s * a2, 4), [pc.Raw('\\sin 2\\theta', 'sin(2theta)', (t) => Math.sin(2 * t))])]).tex;
  const Gf = (t) => (a2 / 2) * t + ((s * a2) / 4) * Math.sin(2 * t);
  const tex = which === 'plain' ? `\\int \\sqrt{${a2}-x^{2}}\\,dx` : `\\int \\frac{x^{2}}{\\sqrt{${a2}-x^{2}}}\\,dx`;
  const f = which === 'plain' ? (x) => Math.sqrt(a2 - x * x) : (x) => (x * x) / Math.sqrt(a2 - x * x);
  const plug = which === 'plain'
    ? [`\\int \\left(${ca(a, '\\cos\\theta')}\\right)\\left(${ca(a, '\\cos\\theta')}\\,d\\theta\\right) = ${thInt}`]
    : [`\\int \\frac{\\left(${ca(a, '\\sin\\theta')}\\right)^{2}\\,${ca(a, '\\cos\\theta')}\\,d\\theta}{${ca(a, '\\cos\\theta')}} = ${thInt}`];
  return build({
    form: 'sin', a, family: 'sqrt_area', famLabel: which === 'plain' ? '√(a²−x²)' : 'x²/√(a²−x²)', level: 2,
    tex, f, domain, answer: ans,
    plugLines: plug,
    thetaIntTex: thInt, Gtex, Gf, thetaThink: `Half-angle: $${which === 'plain' ? '\\cos^2\\theta = \\frac{1+\\cos 2\\theta}{2}' : '\\sin^2\\theta = \\frac{1-\\cos 2\\theta}{2}'}$. Integrate, keeping the ${a2} out front.`, thetaTag: 'identity',
    Gmist: [{ f: (t) => (a2 / 2) * t - ((s * a2) / 4) * Math.sin(2 * t), msg: which === 'plain' ? '$\\cos^2$ gets the plus: $\\frac{1+\\cos 2\\theta}{2}$.' : '$\\sin^2$ gets the minus: $\\frac{1-\\cos 2\\theta}{2}$.', tag: 'identity' }, ...(a !== 1 ? [{ f: (t) => t / 2 + (s / 4) * Math.sin(2 * t), msg: `Keep the ${a2} out front.`, tag: 'kfactor' }] : [])],
    triLines: [`\\sin 2\\theta = 2\\sin\\theta\\cos\\theta = 2\\cdot\\frac{x}{${a}}\\cdot\\frac{\\sqrt{${a2}-x^{2}}}{${a}}`],
    triPrompt: '$\\sin\\theta\\cos\\theta = \\;?$',
    triOptions: [{ tex: ratio(`x\\sqrt{${a2}-x^{2}}`, a2), ok: true }, { tex: ratio('x', `\\sqrt{${a2}-x^{2}}`), msg: 'That is $\\tan\\theta$. Multiply $\\sin\\theta = \\frac{x}{a}$ by $\\cos\\theta = \\frac{\\sqrt{a^2-x^2}}{a}$.' }, { tex: ratio(`\\sqrt{${a2}-x^{2}}`, a2), msg: `$\\sin\\theta = \\frac{x}{${a}}$ contributes an $x$ on top.` }],
    answerLines: [`${Gtex} = \\frac{${a2}}{2}\\theta ${s > 0 ? '+' : '-'} \\frac{${a2}}{2}\\sin\\theta\\cos\\theta`, `= ${ans.tex} + C`],
    mistakes: [
      mk(S([T(Q(a2, 2), [As]), T(Q(-s, 2), [pc.X(1), root])]), 'identity', which === 'plain' ? 'You used the $\\sin^2$ half-angle. $\\cos^2\\theta = \\frac{1 + \\cos 2\\theta}{2}$ (plus).' : 'You used the $\\cos^2$ half-angle. $\\sin^2\\theta = \\frac{1-\\cos 2\\theta}{2}$ (minus).', 4),
      mk(S([T(Q(a2, 2), [As])]), 'rounds', 'You dropped the $\\sin 2\\theta$ term. Convert it with $\\sin 2\\theta = 2\\sin\\theta\\cos\\theta$ and the triangle.', 5),
      a !== 1 ? mk(S([T(Q(1, 2), [As]), T(Q(s, 2), [pc.X(1), root])]), 'kfactor', `The ${a2} from $(${a}\\cos\\theta)(${a}\\cos\\theta)$ stays in front.`, 3) : null,
      which === 'plain' ? mk(S([T(Q(-1, 3), [pc.Raw(`\\left(${a2}-x^{2}\\right)^{3/2}`, '', (x) => Math.pow(a2 - x * x, 1.5))])]), 'power', 'Power rule does not work here because the inside is not just $x$ (no $-2x$ to match). Trig sub it.', null) : mk(S([T(Q(1, 3), [pc.Raw(`\\frac{x^{3}}{\\sqrt{${a2}-x^{2}}}`, `x^3/sqrt(${a2}-x^2)`, (x) => x ** 3 / Math.sqrt(a2 - x * x))])]), 'product', 'You cannot integrate the top and keep the bottom. Trig sub it.', null),
    ],
    hints: [`Number minus $x^2$: $x = ${ca(a, '\\sin\\theta')}$.`, `You get $${thInt}$. Use half-angle.`, '$\\sin 2\\theta = 2\\sin\\theta\\cos\\theta$, then read both off the triangle.'],
  });
}

/* S6, S8, S9: ∫ dx / (x² √(·)) */
function x2_root(level, r, fx = {}) {
  const form = fx.form ?? r.pick(['sin', 'sin', 'tan', 'sec']);
  const a = fx.a ?? r.pick([1, 2, 3, 4]); const a2 = a * a;
  const F = FORM[form];
  let tex, f, domain, ans, plug, thInt, Gtex, Gf, Gmist, triPrompt, triOptions, triLines, mistakes;
  const rr = (num, den) => pc.Raw(`\\frac{${num}}{${den}}`, '', null);
  if (form === 'sin') {
    const rt = (x) => Math.sqrt(a2 - x * x);
    tex = `\\int \\frac{dx}{x^{2}\\sqrt{${a2}-x^{2}}}`; f = (x) => 1 / (x * x * rt(x)); domain = [0.15 * a, 0.85 * a];
    const P1 = pc.Raw(`\\frac{\\sqrt{${a2}-x^{2}}}{${ca(a2, 'x')}}`, `sqrt(${a2}-x^2)/(${a2}x)`, (x) => rt(x) / (a2 * x));
    ans = S([T(-1, [P1])]);
    plug = [`\\int \\frac{${F.dxTex(a)}\\,d\\theta}{\\left(${ca(a, '\\sin\\theta')}\\right)^{2}\\left(${ca(a, '\\cos\\theta')}\\right)} = ${a === 1 ? '' : `\\frac{1}{${a2}}`}\\int \\csc^{2}\\theta\\,d\\theta`];
    thInt = `${a === 1 ? '' : `\\frac{1}{${a2}}`}\\int \\csc^{2}\\theta\\,d\\theta`; Gtex = `-${a === 1 ? '' : `\\frac{1}{${a2}}`}\\cot\\theta`; Gf = (t) => -Math.cos(t) / Math.sin(t) / a2;
    Gmist = [{ f: (t) => Math.cos(t) / Math.sin(t) / a2, msg: '$\\int\\csc^2\\theta\\,d\\theta = -\\cot\\theta$ (minus!).', tag: 'trig-sign' }];
    triPrompt = '$\\cot\\theta = \\;?$'; triLines = [`\\cot\\theta = \\frac{\\text{adj}}{\\text{opp}} = \\frac{\\sqrt{${a2}-x^{2}}}{x}`];
    triOptions = [{ tex: ratio(`\\sqrt{${a2}-x^{2}}`, 'x'), ok: true }, { tex: ratio('x', `\\sqrt{${a2}-x^{2}}`), msg: 'That is $\\tan\\theta$. $\\cot = \\frac{\\text{adj}}{\\text{opp}}$.' }, { tex: ratio(`\\sqrt{${a2}-x^{2}}`, a), msg: 'That is $\\cos\\theta$.' }];
    mistakes = [
      mk(S([T(1, [P1])]), 'trig-sign', '$\\int\\csc^2\\theta\\,d\\theta = -\\cot\\theta$. The minus survives.', 4),
      a !== 1 ? mk(S([T(-1, [pc.Raw(`\\frac{\\sqrt{${a2}-x^{2}}}{x}`, '', (x) => rt(x) / x)])]), 'kfactor', `There is a $\\frac{1}{${a2}}$ out front from $\\frac{${a}}{${a}^2\\cdot ${a}}$.`, 3) : null,
      mk(S([T(-1, [pc.Raw(`\\frac{x}{${a2 === 1 ? '' : a2}\\sqrt{${a2}-x^{2}}}`, '', (x) => x / (a2 * rt(x)))])]), 'triangle', '$\\cot = \\frac{\\text{adj}}{\\text{opp}} = \\frac{\\sqrt{a^2-x^2}}{x}$. You flipped it.', 5),
    ];
  } else if (form === 'tan') {
    const rt = (x) => Math.sqrt(x * x + a2);
    tex = `\\int \\frac{dx}{x^{2}\\sqrt{x^{2}+${a2}}}`; f = (x) => 1 / (x * x * rt(x)); domain = [0.2, 3.2];
    const P1 = pc.Raw(`\\frac{\\sqrt{x^{2}+${a2}}}{${ca(a2, 'x')}}`, `sqrt(x^2+${a2})/(${a2}x)`, (x) => rt(x) / (a2 * x));
    ans = S([T(-1, [P1])]);
    plug = [`\\int \\frac{${F.dxTex(a)}\\,d\\theta}{\\left(${ca(a, '\\tan\\theta')}\\right)^{2}\\left(${ca(a, '\\sec\\theta')}\\right)} = ${a === 1 ? '' : `\\frac{1}{${a2}}`}\\int \\frac{\\sec\\theta}{\\tan^{2}\\theta}\\,d\\theta = ${a === 1 ? '' : `\\frac{1}{${a2}}`}\\int \\frac{\\cos\\theta}{\\sin^{2}\\theta}\\,d\\theta`];
    thInt = `${a === 1 ? '' : `\\frac{1}{${a2}}`}\\int \\frac{\\cos\\theta}{\\sin^{2}\\theta}\\,d\\theta`; Gtex = `-${a === 1 ? '' : `\\frac{1}{${a2}}`}\\csc\\theta`; Gf = (t) => -1 / Math.sin(t) / a2;
    Gmist = [{ f: (t) => 1 / Math.sin(t) / a2, msg: 'u-sub $w = \\sin\\theta$: $\\int w^{-2}dw = -w^{-1}$. Keep the minus.', tag: 'power' }];
    triPrompt = '$\\csc\\theta = \\;?$'; triLines = [`\\csc\\theta = \\frac{\\text{hyp}}{\\text{opp}} = \\frac{\\sqrt{x^{2}+${a2}}}{x}`];
    triOptions = [{ tex: ratio(`\\sqrt{x^{2}+${a2}}`, 'x'), ok: true }, { tex: ratio('x', `\\sqrt{x^{2}+${a2}}`), msg: 'That is $\\sin\\theta$. $\\csc$ is its flip.' }, { tex: ratio(`\\sqrt{x^{2}+${a2}}`, a), msg: 'That is $\\sec\\theta$.' }];
    mistakes = [
      mk(S([T(1, [P1])]), 'trig-sign', '$\\int\\frac{\\cos\\theta}{\\sin^2\\theta}d\\theta = -\\frac{1}{\\sin\\theta}$. Keep the minus.', 4),
      a !== 1 ? mk(S([T(-1, [pc.Raw(`\\frac{\\sqrt{x^{2}+${a2}}}{x}`, '', (x) => rt(x) / x)])]), 'kfactor', `Keep the $\\frac{1}{${a2}}$.`, 3) : null,
      mk(S([T(-1, [pc.Raw(`\\frac{x}{${a2}\\sqrt{x^{2}+${a2}}}`, '', (x) => x / (a2 * rt(x)))])]), 'triangle', '$\\csc = \\frac{\\text{hyp}}{\\text{opp}}$. You flipped it.', 5),
    ];
  } else {
    const rt = (x) => Math.sqrt(x * x - a2);
    tex = `\\int \\frac{dx}{x^{2}\\sqrt{x^{2}-${a2}}}`; f = (x) => 1 / (x * x * rt(x)); domain = [1.2 * a, 3 * a];
    const P1 = pc.Raw(`\\frac{\\sqrt{x^{2}-${a2}}}{${ca(a2, 'x')}}`, `sqrt(x^2-${a2})/(${a2}x)`, (x) => rt(x) / (a2 * x));
    ans = S([T(1, [P1])]);
    plug = [`\\int \\frac{${F.dxTex(a)}\\,d\\theta}{\\left(${ca(a, '\\sec\\theta')}\\right)^{2}\\left(${ca(a, '\\tan\\theta')}\\right)} = ${a === 1 ? '' : `\\frac{1}{${a2}}`}\\int \\cos\\theta\\,d\\theta`];
    thInt = `${a === 1 ? '' : `\\frac{1}{${a2}}`}\\int \\cos\\theta\\,d\\theta`; Gtex = `${a === 1 ? '' : `\\frac{1}{${a2}}`}\\sin\\theta`; Gf = (t) => Math.sin(t) / a2;
    Gmist = [{ f: (t) => -Math.sin(t) / a2, msg: '$\\int\\cos\\theta\\,d\\theta = +\\sin\\theta$.', tag: 'trig-sign' }];
    triPrompt = '$\\sin\\theta = \\;?$'; triLines = [`\\sin\\theta = \\frac{\\text{opp}}{\\text{hyp}} = \\frac{\\sqrt{x^{2}-${a2}}}{x}`];
    triOptions = [{ tex: ratio(`\\sqrt{x^{2}-${a2}}`, 'x'), ok: true }, { tex: ratio(a, 'x'), msg: 'That is $\\cos\\theta$ (adjacent over hypotenuse).' }, { tex: ratio(`\\sqrt{x^{2}-${a2}}`, a), msg: 'That is $\\tan\\theta$.' }];
    mistakes = [
      mk(S([T(-1, [P1])]), 'trig-sign', '$\\int\\cos\\theta = +\\sin\\theta$.', 4),
      a !== 1 ? mk(S([T(1, [pc.Raw(`\\frac{\\sqrt{x^{2}-${a2}}}{x}`, '', (x) => rt(x) / x)])]), 'kfactor', `Keep the $\\frac{1}{${a2}}$.`, 3) : null,
      mk(S([T(1, [pc.Raw(`\\frac{1}{${a}x}`, '', (x) => 1 / (a * x))])]), 'triangle', '$\\sin\\theta = \\frac{\\text{opp}}{\\text{hyp}} = \\frac{\\sqrt{x^2-a^2}}{x}$, not $\\frac{a}{x}$.', 5),
    ];
  }
  return build({
    form, a, family: 'x2_root', famLabel: `1/(x²√·) ${form}`, level: form === 'sin' ? 2 : 3,
    tex, f, domain, answer: ans, plugLines: plug, thetaIntTex: thInt, Gtex, Gf, Gmist,
    thetaThink: form === 'sin' ? '$\\frac{1}{\\sin^2\\theta} = \\csc^2\\theta$, and $\\int\\csc^2\\theta = -\\cot\\theta$.' : form === 'tan' ? 'Rewrite in $\\sin$/$\\cos$, then u-sub $w = \\sin\\theta$.' : 'After canceling you just have $\\cos\\theta$.',
    triPrompt, triOptions, triLines,
    answerLines: [`= ${ans.tex} + C`],
    mistakes,
    hints: [`The radical is $${F.shape(a2)}$: so $${F.sub(a)}$.`, `After plugging in and canceling: $${thInt}$.`, 'Read the ratio you need off the triangle.'],
  });
}

/* S10, S11: ∫ dx/(a² ± x²)^{3/2} */
function pow32(level, r, fx = {}) {
  const form = fx.form ?? r.pick(['tan', 'sin']);
  const a = fx.a ?? r.pick([1, 2, 3]); const a2 = a * a;
  const F = FORM[form];
  const sgn = form === 'tan' ? '+' : '-';
  const rt = form === 'tan' ? (x) => Math.sqrt(a2 + x * x) : (x) => Math.sqrt(a2 - x * x);
  const P1 = pc.Raw(`\\frac{x}{${a2}\\sqrt{${a2}${sgn}x^{2}}}`, `x/(${a2}*sqrt(${a2}${sgn}x^2))`, (x) => x / (a2 * rt(x)));
  const ans = S([T(1, [P1])]);
  const domain = form === 'tan' ? [-2.5, 3] : [0.1 * a, 0.85 * a];
  const thInt = `${a === 1 ? '' : `\\frac{1}{${a2}}`}\\int ${form === 'tan' ? '\\cos\\theta' : '\\sec^{2}\\theta'}\\,d\\theta`;
  const Gtex = `${a === 1 ? '' : `\\frac{1}{${a2}}`}${form === 'tan' ? '\\sin\\theta' : '\\tan\\theta'}`;
  const Gf = form === 'tan' ? (t) => Math.sin(t) / a2 : (t) => Math.tan(t) / a2;
  const radT = F.radTex(a);
  return build({
    form, a, family: 'pow32', famLabel: `(a²${sgn}x²)³ᐟ²`, level: 3,
    tex: `\\int \\frac{dx}{\\left(${a2}${sgn}x^{2}\\right)^{3/2}}`, f: (x) => 1 / rt(x) ** 3, domain, answer: ans,
    shapeNote: `$(${a2}${sgn}x^2)^{3/2} = \\left(\\sqrt{${a2}${sgn}x^2}\\right)^3$`,
    plugLines: [`\\left(${a2}${sgn}x^{2}\\right)^{3/2} = \\left(${radT}\\right)^{3}`, `\\int \\frac{${F.dxTex(a)}\\,d\\theta}{\\left(${radT}\\right)^{3}} = ${thInt}`],
    thetaIntTex: thInt, Gtex, Gf, thetaTag: 'trig-sign',
    Gmist: [{ f: (t) => -Gf(t), msg: form === 'tan' ? '$\\int\\cos\\theta = +\\sin\\theta$.' : '$\\int\\sec^2\\theta = +\\tan\\theta$.', tag: 'trig-sign' }],
    thetaThink: form === 'tan' ? '$\\frac{\\sec^2\\theta}{\\sec^3\\theta} = \\frac{1}{\\sec\\theta} = \\cos\\theta$.' : '$\\frac{\\cos\\theta}{\\cos^3\\theta} = \\sec^2\\theta$.',
    triPrompt: form === 'tan' ? '$\\sin\\theta = \\;?$' : '$\\tan\\theta = \\;?$',
    triLines: [form === 'tan' ? `\\sin\\theta = \\frac{x}{\\sqrt{x^{2}+${a2}}}` : `\\tan\\theta = \\frac{x}{\\sqrt{${a2}-x^{2}}}`],
    triOptions: form === 'tan'
      ? [{ tex: ratio('x', `\\sqrt{x^{2}+${a2}}`), ok: true }, { tex: ratio(a, `\\sqrt{x^{2}+${a2}}`), msg: 'That is $\\cos\\theta$.' }, { tex: ratio('x', a), msg: 'That is $\\tan\\theta$.' }]
      : [{ tex: ratio('x', `\\sqrt{${a2}-x^{2}}`), ok: true }, { tex: ratio(`\\sqrt{${a2}-x^{2}}`, 'x'), msg: 'That is $\\cot\\theta$.' }, { tex: ratio('x', a), msg: 'That is $\\sin\\theta$.' }],
    answerLines: [`= ${ans.tex} + C`],
    mistakes: [
      mk(M.sumNeg(ans), 'trig-sign', 'Sign slip while integrating in $\\theta$.', 4),
      a !== 1 ? mk(S([T(1, [pc.Raw(`\\frac{x}{\\sqrt{${a2}${sgn}x^{2}}}`, '', (x) => x / rt(x))])]), 'kfactor', `Keep the $\\frac{1}{${a2}}$ from $\\frac{${a}}{${a}^3}$.`, 3) : null,
      mk(S([T(1, [pc.Raw(`\\frac{1}{${a}\\sqrt{${a2}${sgn}x^{2}}}`, '', (x) => 1 / (a * rt(x)))])]), 'triangle', 'Read the ratio again: opposite is $x$.', 5),
    ],
    hints: [`$(${a2}${sgn}x^2)^{3/2}$ is a radical cubed: $${F.sub(a)}$.`, `After canceling: $${thInt}$.`, 'Use the triangle for the final ratio.'],
  });
}

/* S12: ∫ √(x² − a²) / x dx */
function sqrt_over_x(level, r, fx = {}) {
  const a = fx.a ?? r.pick([1, 2, 3, 4]); const a2 = a * a;
  const rt = (x) => Math.sqrt(x * x - a2);
  const R = pc.Sqrt(M.P(`x^{2}-${a2}`, `x^2-${a2}`, (x) => x * x - a2));
  const As = pc.Arc('arcsec', xa(a));
  const ans = S([T(1, [R]), T(-a, [As])]);
  const domain = [1.2 * a, 3 * a];
  return build({
    form: 'sec', a, family: 'sqrt_over_x', famLabel: '√(x²−a²)/x', level: 3,
    tex: `\\int \\frac{\\sqrt{x^{2}-${a2}}}{x}\\,dx`, f: (x) => rt(x) / x, domain, answer: ans,
    plugLines: [`\\int \\frac{\\left(${ca(a, '\\tan\\theta')}\\right)\\left(${FORM.sec.dxTex(a)}\\,d\\theta\\right)}{${ca(a, '\\sec\\theta')}} = ${ca(a, '\\int\\tan^{2}\\theta\\,d\\theta')} = ${ca(a, '\\int(\\sec^{2}\\theta - 1)\\,d\\theta')}`],
    thetaIntTex: ca(a, '\\int(\\sec^{2}\\theta - 1)\\,d\\theta'), Gtex: a === 1 ? '\\tan\\theta - \\theta' : `${a}\\tan\\theta - ${a}\\theta`, Gf: (t) => a * (Math.tan(t) - t), thetaTag: 'identity',
    Gmist: [{ f: (t) => a * (Math.tan(t) + t), msg: '$\\tan^2\\theta = \\sec^2\\theta - 1$, so subtract $\\theta$.', tag: 'identity' }],
    thetaThink: '$\\tan^2\\theta = \\sec^2\\theta - 1$, then $\\int\\sec^2 = \\tan$.',
    triPrompt: '$\\tan\\theta = \\;?$', triLines: [`\\tan\\theta = \\frac{\\sqrt{x^{2}-${a2}}}{${a}},\\quad \\theta = \\operatorname{arcsec}\\left(\\frac{x}{${a}}\\right)`],
    triOptions: [{ tex: ratio(`\\sqrt{x^{2}-${a2}}`, a), ok: true }, { tex: ratio(a, `\\sqrt{x^{2}-${a2}}`), msg: 'That is $\\cot\\theta$.' }, { tex: ratio(`\\sqrt{x^{2}-${a2}}`, 'x'), msg: 'That is $\\sin\\theta$.' }],
    answerLines: [`${ca(a, '\\cdot\\frac{\\sqrt{x^{2}-' + a2 + '}}{' + a + '}')} - ${ca(a, '\\operatorname{arcsec}\\left(\\frac{x}{' + a + '}\\right)')}`, `= ${ans.tex} + C`],
    mistakes: [
      mk(S([T(1, [R]), T(a, [As])]), 'identity', '$\\tan^2 = \\sec^2 - 1$ (minus), so it is $-a\\theta$.', 4),
      a !== 1 ? mk(S([T(1, [R]), T(-1, [As])]), 'kfactor', `The ${a} multiplies the $\\theta$ too: $${a}(\\tan\\theta - \\theta)$.`, 4) : null,
      mk(S([T(1, [R])]), 'rounds', 'You dropped the $-a\\theta$ piece.', 5),
    ],
    hints: [`$x^2$ minus a number: $x = ${ca(a, '\\sec\\theta')}$.`, 'You get $a\\int\\tan^2\\theta\\,d\\theta$. Use $\\tan^2 = \\sec^2 - 1$.', `$\\theta = \\operatorname{arcsec}(x/${a})$.`],
  });
}

/* S13/S14: complete the square */
function complete_sq(level, r, fx = {}) {
  const kind = fx.kind ?? r.pick(['atan', 'asin']);
  if (kind === 'atan') {
    const h = fx.h ?? r.pick([1, 2, 3, -1, -2]);
    const a = fx.a ?? r.pick([1, 2, 3]); const a2 = a * a;
    const c = h * h + a2;
    const den = M.poly([1, 2 * h, c]);
    const inner = M.P(a === 1 ? `x ${h > 0 ? '+' : '-'} ${Math.abs(h)}` : `\\frac{x ${h > 0 ? '+' : '-'} ${Math.abs(h)}}{${a}}`, `(x+${h})/${a}`, (x) => (x + h) / a);
    const ans = S([T(Q(1, a), [pc.Arc('arctan', inner)])]);
    const sq = (hh, rest) => `(x ${hh > 0 ? '+' : '-'} ${Math.abs(hh)})^{2} + ${rest}`;
    const domain = [-h - 2.2, -h + 2.4];
    const shift = M.P(a === 1 ? 'x' : `\\frac{x}{${a}}`, '', (x) => x / a);
    return {
      family: 'complete_sq', famLabel: 'complete the square (arctan)', level: 3,
      tex: `\\int \\frac{dx}{${den.tex}}`, f: (x) => 1 / den.f(x), domain, answer: ans,
      mistakes: [
        a !== 1 ? mk(S([T(1, [pc.Arc('arctan', inner)])]), 'kfactor', `$\\int\\frac{du}{u^2+${a2}} = \\frac{1}{${a}}\\arctan\\frac{u}{${a}}$. Keep the $\\frac{1}{${a}}$.`, 1) : null,
        mk(S([T(Q(1, a), [pc.Arc('arctan', shift)])]), 'algebra', `Do not forget the shift: $u = x ${h > 0 ? '+' : '-'} ${Math.abs(h)}$.`, 1),
        mk(S([T(Q(1, a), [pc.Arc('arctan', M.P(a === 1 ? `x ${h > 0 ? '-' : '+'} ${Math.abs(h)}` : `\\frac{x ${h > 0 ? '-' : '+'} ${Math.abs(h)}}{${a}}`, '', (x) => (x - h) / a))])]), 'sign', `$(x ${h > 0 ? '+' : '-'} ${Math.abs(h)})^2$ means $u = x ${h > 0 ? '+' : '-'} ${Math.abs(h)}$.`, 0),
        mk(S([T(1, [pc.Ln(den, false)])]), 'usub', 'A $\\ln$ needs the derivative of the bottom on top. Here the top is just $dx$.', null),
      ].filter(Boolean),
      hints: ['No root, but the bottom does not factor: complete the square.', `Half of ${2 * h} is ${h}; square it: ${h * h}. So ${den.tex} = $(x ${h > 0 ? '+' : '-'} ${Math.abs(h)})^2 + ${a2}$.`.replace(den.tex, `$${den.tex}$`), `Then $u = x ${h > 0 ? '+' : '-'} ${Math.abs(h)}$ and use $\\int\\frac{du}{u^2+a^2} = \\frac1a\\arctan\\frac ua$.`],
      steps: [
        { title: 'Complete the square', think: `Take half the $x$-coefficient (${2 * h} → ${h}), square it (${h * h}), and see what is left over (${c} − ${h * h} = ${a2}).`, lines: [`${den.tex} = (x^{2} ${h > 0 ? '+' : '-'} ${Math.abs(2 * h)}x + ${h * h}) + ${a2} = ${sq(h, a2)}`], check: st.choice(`$${den.tex} = \\;?$`, [{ tex: sq(h, a2), ok: true }, { tex: sq(h, c), msg: `You added ${h * h} inside the square, so take it back out: ${c} − ${h * h} = ${a2}.` }, { tex: sq(2 * h, a2), msg: `Halve the middle coefficient: ${2 * h} → ${h}.` }, { tex: sq(-h, a2), msg: 'Keep the sign of the middle term.' }], 3), tag: 'algebra' },
        { title: 'Shift with u', think: `Let $u = x ${h > 0 ? '+' : '-'} ${Math.abs(h)}$, so $du = dx$. Now it is the arctan form with $a = ${a}$.`, lines: [`\\int \\frac{du}{u^{2} + ${a2}} = ${a === 1 ? '' : `\\frac{1}{${a}}`}\\arctan\\left(${a === 1 ? 'u' : `\\frac{u}{${a}}`}\\right)`], check: st.expr(`\\int \\frac{du}{u^{2}+${a2}} =`, { vars: ['u'], expect: (u) => Math.atan(u / a) / a, exact: false, domain: [-1.5, 2], mistakes: a !== 1 ? [{ f: (u) => Math.atan(u / a), msg: `Keep the $\\frac{1}{${a}}$ out front.`, tag: 'kfactor' }] : [], points: 3, answerTex: `${a === 1 ? '' : `\\frac{1}{${a}}`}\\arctan\\left(${a === 1 ? 'u' : `\\frac{u}{${a}}`}\\right)` }), tag: 'kfactor' },
        { title: 'Back to x + C', think: 'Put $u$ back.', lines: [`= ${ans.tex} + C`], check: st.final(6), tag: 'backsub' },
      ],
    };
  }
  // arcsin version: √(a² − (x−h)²)
  const h = fx.h ?? r.pick([1, 2, 3]);
  let a = fx.a ?? r.pick([2, 3, 4]); if (a < h) a = h;
  const a2 = a * a, c = a2 - h * h;
  const inside = M.poly([-1, 2 * h, c]);
  const insideTex = (c === 0 ? `${2 * h}x - x^{2}` : `${c} + ${2 * h}x - x^{2}`);
  const inner = M.P(`\\frac{x - ${h}}{${a}}`, `(x-${h})/${a}`, (x) => (x - h) / a);
  const ans = S([T(1, [pc.Arc('arcsin', inner)])]);
  const domain = [h - 0.75 * a, h + 0.8 * a];
  return {
    family: 'complete_sq', famLabel: 'complete the square (arcsin)', level: 3,
    tex: `\\int \\frac{dx}{\\sqrt{${insideTex}}}`, f: (x) => 1 / Math.sqrt(inside.f(x)), domain, answer: ans,
    mistakes: [
      mk(S([T(1, [pc.Arc('arcsin', M.P(`\\frac{x}{${a}}`, '', (x) => x / a))])]), 'algebra', `Do not forget the shift: $u = x - ${h}$.`, 1),
      mk(S([T(1, [pc.Arc('arcsin', M.P(`\\frac{x + ${h}}{${a}}`, '', (x) => (x + h) / a))])]), 'sign', `$-(x - ${h})^2$: the shift is $x - ${h}$.`, 0),
      mk(S([T(1, [pc.Arc('arccos', inner)])]), 'sign', 'arccos has the opposite sign derivative. This is the arcsin form.', 2),
      mk(S([T(Q(1, a), [pc.Arc('arcsin', inner)])]), 'kfactor', 'For arcsin there is no $\\frac{1}{a}$ out front.', 1),
    ],
    hints: ['Under the root: complete the square (factor out the minus first).', `$${insideTex} = ${a2} - (x - ${h})^2$.`, '$\\int\\frac{du}{\\sqrt{a^2-u^2}} = \\arcsin\\frac{u}{a}$.'],
    steps: [
      { title: 'Complete the square', think: `Factor out the minus from the $x$ terms: $-(x^2 - ${2 * h}x)$. Complete the square inside: $-(x - ${h})^2 + ${h * h}$. Then combine the numbers.`, lines: [`${insideTex} = ${c ? c + ' ' : ''}- (x^{2} - ${2 * h}x) = ${c ? c + ' + ' : ''}${h * h} - (x - ${h})^{2} = ${a2} - (x - ${h})^{2}`], check: st.choice(`$${insideTex} = \\;?$`, [{ tex: `${a2} - (x - ${h})^{2}`, ok: true }, { tex: `(x - ${h})^{2} - ${a2}`, msg: 'The $-x^2$ means the square is subtracted.' }, { tex: `${a2} - (x + ${h})^{2}`, msg: `Inside it is $x^2 - ${2 * h}x$, so $x - ${h}$.` }, { tex: `${c || h * h} - (x - ${h})^{2}`, msg: `Add the ${h * h} back: ${c} + ${h * h} = ${a2}.` }].filter((o, i, arr) => arr.findIndex((p) => p.tex === o.tex) === i), 3), tag: 'algebra' },
        { title: 'Shift with u', think: `Let $u = x - ${h}$, $du = dx$. Now it is the arcsin form with $a = ${a}$.`, lines: [`\\int \\frac{du}{\\sqrt{${a2} - u^{2}}} = \\arcsin\\left(\\frac{u}{${a}}\\right)`], check: st.expr(`\\int \\frac{du}{\\sqrt{${a2}-u^{2}}} =`, { vars: ['u'], expect: (u) => Math.asin(u / a), exact: false, domain: [-0.7 * a, 0.8 * a], mistakes: [{ f: (u) => Math.asin(u / a) / a, msg: 'No $\\frac{1}{a}$ for arcsin. (That is the arctan formula.)', tag: 'kfactor' }], points: 3, answerTex: `\\arcsin\\left(\\frac{u}{${a}}\\right)` }), tag: 'tsub-form' },
        { title: 'Back to x + C', think: 'Put $u$ back.', lines: [`= ${ans.tex} + C`], check: st.final(6), tag: 'backsub' },
      ],
    };
}

const FAM = { asin: asin_basic, atan: atan_basic, ln_plus, ln_minus, sqrt_area, x2_root, pow32, sqrt_over_x, complete_sq };
M.TSUB_FAMILIES = FAM;
const BY_LEVEL = {
  1: [[asin_basic, 3], [atan_basic, 3], [sqrt_area, 2], [ln_plus, 1]],
  2: [[sqrt_area, 3], [x2_root, 3], [ln_plus, 2], [ln_minus, 2], [pow32, 1]],
  3: [[x2_root, 2], [pow32, 2], [sqrt_over_x, 2], [complete_sq, 3], [sqrt_area, 1]],
};
M.GEN.tsub = function (level, r, family) {
  const fam = family ? FAM[family] : r.pickW(BY_LEVEL[level] || BY_LEVEL[1]);
  const p = fam(level, r);
  p.level = level;
  return p;
};
})(typeof globalThis !== 'undefined' ? globalThis : this);
