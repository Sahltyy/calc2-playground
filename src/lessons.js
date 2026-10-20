/* ==========================================================================
   LESSONS — one concept per card, each with a visual
   ========================================================================== */
(function (G) {
'use strict';
const M = G.M;

M.LESSONS = {
  ibp: [
    {
      title: 'Parts undoes the product rule',
      body: 'u-sub undoes the **chain rule**. Integration by parts undoes the **product rule**. Integrate both sides of the product rule and rearrange:',
      visual: { type: 'reveal', lines: [
        '(uv)\' = u\'v + uv\'',
        'uv = \\int v\\,du + \\int u\\,dv',
        '\\boxed{\\int u\\,dv = uv - \\int v\\,du}',
      ] },
      check: { prompt: 'When is parts your tool?', options: [
        { text: 'Two different kinds of function multiplied, and neither is the derivative of the other', ok: true },
        { text: 'A function times its own derivative', msg: 'That is a u-sub situation: the derivative is already sitting there.' },
      ] },
    },
    {
      title: 'See it: two areas, one rectangle',
      body: 'Plot $v$ against $u$. The rectangle $uv$ splits into two pieces: the area under the curve ($\\int v\\,du$) and the area beside it ($\\int u\\,dv$). Drag the slider: the two pieces always add up to the rectangle.',
      visual: { type: 'area' },
    },
    {
      title: 'Pick u with LIATE',
      body: 'Go down the list. Whichever function shows up **first** is your $u$. You want $u$ to get simpler when you differentiate it, and $dv$ to be something you can integrate.',
      visual: { type: 'liate' },
    },
    {
      title: 'The 4-box',
      body: 'Down the left side: differentiate. Down the right side: integrate. Then read the answer off the box: $uv - \\int v\\,du$.',
      visual: { type: 'box', u: 'x', dv: 'e^{x}\\,dx', du: 'dx', v: 'e^{x}', result: '\\int x e^{x}dx = x e^{x} - \\int e^{x}dx = xe^{x} - e^{x} + C' },
      check: { prompt: 'In the box for $\\int x\\cos x\\,dx$, what is $v$?', options: [
        { tex: '\\sin x', ok: true },
        { tex: '-\\sin x', msg: '$\\int\\cos x\\,dx = +\\sin x$.' },
        { tex: '\\frac{x^2}{2}', msg: '$v$ comes from integrating $dv = \\cos x\\,dx$.' },
      ] },
    },
    {
      title: 'Shortcuts for the number next to x',
      body: 'Call the number next to $x$ "$k$". Integrating **divides** by $k$. (Differentiating multiplies. That is the trap.)',
      visual: { type: 'tex', lines: [
        '\\int e^{kx}\\,dx = \\tfrac{1}{k}e^{kx}',
        '\\int \\sin(kx)\\,dx = -\\tfrac{1}{k}\\cos(kx)',
        '\\int \\cos(kx)\\,dx = \\tfrac{1}{k}\\sin(kx)',
        '\\tfrac{d}{dx}\\ln(kx) = \\tfrac{1}{x}\\quad(\\text{the }k\\text{ cancels})',
      ] },
      check: { prompt: '$\\int e^{3x}\\,dx = \\;?$', options: [
        { tex: '\\tfrac{1}{3}e^{3x}', ok: true },
        { tex: '3e^{3x}', msg: 'That is the derivative. Integrating divides by 3.' },
        { tex: 'e^{3x}', msg: 'Close, but divide by the 3.' },
      ] },
    },
    {
      title: 'How many rounds? Use the table',
      body: '$\\ln$ problems and $x$ problems: 1 round. $x^2$: 2 rounds. $x^3$: 3 rounds. Instead of doing parts over and over, use the **DI table**: differentiate down D until it hits 0, integrate down I, alternate signs, multiply along the diagonals.',
      visual: { type: 'di' },
    },
    {
      title: 'The boomerang',
      body: 'For $e^{x}\\sin x$ or $e^{x}\\cos x$, nothing ever dies. Do parts twice and the original integral comes back. Then solve for it like algebra.',
      visual: { type: 'boomerang' },
    },
    {
      title: 'Only one function? Let dv = dx',
      body: 'For $\\int\\ln x\\,dx$ or $\\int\\arctan x\\,dx$ there is just one function. Pretend it is multiplied by 1: $u$ is the function, $dv = dx$.',
      visual: { type: 'box', u: '\\ln x', dv: 'dx', du: '\\tfrac{1}{x}dx', v: 'x', result: '\\int \\ln x\\,dx = x\\ln x - \\int x\\cdot\\tfrac{1}{x}dx = x\\ln x - x + C' },
    },
  ],
  trig: [
    {
      title: 'Your three power tools',
      body: 'Almost every trig integral is one of these identities plus a u-sub. Know them cold.',
      visual: { type: 'cards', items: [
        { label: 'Pythagorean', tex: '\\sin^{2}x + \\cos^{2}x = 1' },
        { label: 'Pythagorean (÷ cos²)', tex: '1 + \\tan^{2}x = \\sec^{2}x' },
        { label: 'Half-angle', tex: '\\sin^{2}x = \\frac{1-\\cos 2x}{2}' },
        { label: 'Half-angle', tex: '\\cos^{2}x = \\frac{1+\\cos 2x}{2}' },
      ] },
    },
    {
      title: 'The decision tree',
      body: 'Look at the powers first. Odd means you can **save one** for $du$. All even means **half-angle**.',
      visual: { type: 'flow' },
      check: { prompt: '$\\int\\sin^{2}x\\cos^{5}x\\,dx$: what do you save?', options: [
        { text: 'One $\\cos x$ (its power is odd), then $u = \\sin x$', ok: true },
        { text: 'One $\\sin x$', msg: 'The power on $\\sin$ is 2 (even). Save from the odd one.' },
        { text: 'Nothing, use half-angle', msg: 'Half-angle is for when every power is even.' },
      ] },
    },
    {
      title: 'Save one: watch it work',
      body: 'Peel off one $\\sin x$ to be part of $du$. Everything else becomes $\\cos$. Then $u = \\cos x$, and do not lose the minus in $du$.',
      visual: { type: 'reveal', lines: [
        '\\int \\sin^{3}x\\,dx = \\int \\sin^{2}x\\cdot\\htmlClass{hu}{\\sin x}\\,dx',
        '= \\int (1-\\cos^{2}x)\\,\\htmlClass{hu}{\\sin x}\\,dx',
        'u = \\cos x,\\quad \\htmlClass{hu}{du = -\\sin x\\,dx}',
        '= -\\int (1-u^{2})\\,du = -u + \\tfrac{u^{3}}{3}',
        '= -\\cos x + \\tfrac{\\cos^{3}x}{3} + C',
      ] },
    },
    {
      title: 'All even: lower the power',
      body: '$\\sin^2 x$ is just a cosine wave, shifted up to $\\frac12$ and squished to half height. That is exactly what the half-angle identity says.',
      visual: { type: 'halfwave' },
      check: { prompt: '$\\cos^{2}\\theta = \\;?$', options: [
        { tex: '\\frac{1+\\cos 2\\theta}{2}', ok: true },
        { tex: '\\frac{1-\\cos 2\\theta}{2}', msg: 'That is $\\sin^2$. Cosine gets the plus.' },
      ] },
    },
    {
      title: 'tan and sec: save a derivative',
      body: 'Two derivatives to remember: $\\frac{d}{dx}\\tan x = \\sec^2 x$ and $\\frac{d}{dx}\\sec x = \\sec x\\tan x$. Save whichever one the powers let you save.',
      visual: { type: 'cards', items: [
        { label: 'sec power even', tex: '\\text{save }\\sec^{2}x,\\; u = \\tan x' },
        { label: 'tan power odd', tex: '\\text{save }\\sec x\\tan x,\\; u = \\sec x' },
        { label: 'convert with', tex: '\\sec^{2}x = 1 + \\tan^{2}x' },
        { label: 'or with', tex: '\\tan^{2}x = \\sec^{2}x - 1' },
      ] },
    },
    {
      title: 'Different angles? Product to sum',
      body: 'When two trig functions have different angles, like $\\sin 3x\\cos 2x$, turn the product into a sum first.',
      visual: { type: 'tex', lines: [
        '\\sin A\\cos B = \\tfrac{1}{2}[\\sin(A-B) + \\sin(A+B)]',
        '\\sin A\\sin B = \\tfrac{1}{2}[\\cos(A-B) - \\cos(A+B)]',
        '\\cos A\\cos B = \\tfrac{1}{2}[\\cos(A-B) + \\cos(A+B)]',
      ] },
    },
    {
      title: 'The trap list',
      body: 'These are the ones that cost points on tests.',
      visual: { type: 'traps', items: [
        { bad: '\\int \\sin^{3}x\\,dx = \\tfrac{\\sin^{4}x}{4}', why: 'No power rule on trig. $\\sin x$ is not $x$.' },
        { bad: 'u = \\cos x \\Rightarrow du = \\sin x\\,dx', why: 'Derivative of $\\cos$ is $-\\sin$.' },
        { bad: '\\sin^{2}x = \\tfrac{1+\\cos 2x}{2}', why: '$\\sin^2$ gets the minus.' },
      ] },
    },
  ],
  tsub: [
    {
      title: 'Radicals vs. identities',
      body: 'A root like $\\sqrt{9 - x^2}$ will not cancel. But if $x = 3\\sin\\theta$, the identity $1 - \\sin^2\\theta = \\cos^2\\theta$ turns it into a perfect square.',
      visual: { type: 'reveal', lines: [
        '\\sqrt{9-x^{2}}',
        '= \\sqrt{9 - 9\\sin^{2}\\theta}',
        '= \\sqrt{9(1-\\sin^{2}\\theta)} = \\sqrt{9\\cos^{2}\\theta}',
        '= 3\\cos\\theta \\quad\\text{(the root is gone)}',
      ] },
    },
    {
      title: 'Three shapes, three substitutions',
      body: 'Match the shape under the root. Tap each one to see its triangle.',
      visual: { type: 'triangles' },
      check: { prompt: '$\\sqrt{x^{2} + 25}$ calls for:', options: [
        { tex: 'x = 5\\tan\\theta', ok: true },
        { tex: 'x = 5\\sin\\theta', msg: 'sin is for number minus $x^2$.' },
        { tex: 'x = 5\\sec\\theta', msg: 'sec is for $x^2$ minus number.' },
      ] },
    },
    {
      title: 'The 5-step recipe',
      body: 'Same five moves every time.',
      visual: { type: 'steps', items: [
        'Pick the substitution from the shape',
        'Find $dx$ (differentiate)',
        'Kill the radical with the identity',
        'Plug everything in, cancel, integrate in $\\theta$',
        'Draw the triangle to get back to $x$',
      ] },
    },
    {
      title: 'Back to x: draw the triangle',
      body: 'From $x = 3\\sin\\theta$ you know $\\sin\\theta = \\frac{x}{3} = \\frac{\\text{opp}}{\\text{hyp}}$. Pythagoras gives the third side. Now any trig function of $\\theta$ can be read off.',
      visual: { type: 'triangleRead' },
      check: { prompt: 'With opp $= x$, hyp $= 3$, adj $= \\sqrt{9-x^2}$: $\\tan\\theta = \\;?$', options: [
        { tex: '\\frac{x}{\\sqrt{9-x^{2}}}', ok: true },
        { tex: '\\frac{\\sqrt{9-x^{2}}}{x}', msg: 'That is $\\cot\\theta$ (flipped).' },
        { tex: '\\frac{x}{3}', msg: 'That is $\\sin\\theta$.' },
      ] },
    },
    {
      title: 'Do not trig-sub a u-sub',
      body: 'If the derivative of the inside is already there, u-sub is faster. $\\int\\frac{x}{\\sqrt{9-x^2}}dx$: the $x$ on top is half of $\\frac{d}{dx}(9-x^2)$, so $u = 9 - x^2$.',
      visual: { type: 'tex', lines: ['\\int \\frac{x}{\\sqrt{9-x^{2}}}\\,dx = -\\sqrt{9-x^{2}} + C', '\\text{(no triangle needed)}'] },
    },
    {
      title: 'Completing the square',
      body: 'No root shape yet? Complete the square to reveal one, then shift with $u$.',
      visual: { type: 'reveal', lines: [
        'x^{2} + 4x + 13',
        '= (x^{2} + 4x + 4) + 9',
        '= (x+2)^{2} + 3^{2}',
        '\\int \\frac{dx}{(x+2)^{2} + 9} = \\tfrac{1}{3}\\arctan\\left(\\tfrac{x+2}{3}\\right) + C',
      ] },
    },
  ],
  pf: [
    {
      title: 'Un-adding fractions',
      body: 'You already know how to add fractions. Partial fractions runs that backwards, so one hard fraction becomes a few easy ones.',
      visual: { type: 'fractions' },
    },
    {
      title: 'The Master 5-Step Checklist',
      body: 'Every partial-fractions problem runs these five steps, in this order. Tap each one.',
      visual: { type: 'recipe', unit: 'pf' },
    },
    {
      title: 'Step 1: the degree check',
      body: 'If the top\'s degree is at least the bottom\'s, it is improper: long-divide FIRST. Partial fractions only works on proper fractions.',
      visual: { type: 'tex', lines: ['\\frac{x^{2}+1}{x^{2}-1} = 1 + \\frac{2}{x^{2}-1}', '\\text{degree } 2 \\ge 2 \\;\\Rightarrow\\; \\text{divide first}'] },
      check: { prompt: '$\\frac{3x+1}{x^{2}-4}$ is:', options: [
        { text: 'Proper (1 < 2): go straight to partial fractions', ok: true },
        { text: 'Improper: divide first', msg: 'Top degree 1, bottom degree 2. Top is smaller, so proper.' },
      ] },
    },
    {
      title: 'Long division, one move at a time',
      body: 'Write every power (a 0 for missing ones). Then repeat: divide the leading terms, multiply back, subtract, bring down. This is class Example 1.',
      visual: { type: 'longdiv' },
    },
    {
      title: 'One template per factor',
      body: 'Factor the bottom completely. Each kind of factor gets its own kind of fraction. Repeated factors get one fraction per power.',
      visual: { type: 'templates' },
      check: { prompt: 'Template for $\\frac{\\cdots}{x(x^{2}+1)^{2}}$?', options: [
        { tex: '\\frac{A}{x} + \\frac{Bx + C}{x^{2}+1} + \\frac{Dx + E}{(x^{2}+1)^{2}}', ok: true },
        { tex: '\\frac{A}{x} + \\frac{Bx + C}{(x^{2}+1)^{2}}', msg: 'The quadratic repeats, so it needs a fraction for $x^2+1$ AND one for $(x^2+1)^2$.' },
        { tex: '\\frac{A}{x} + \\frac{B}{x^{2}+1} + \\frac{C}{(x^{2}+1)^{2}}', msg: 'Over a quadratic, the top is linear: $Bx + C$.' },
      ] },
    },
    {
      title: 'Heaviside cover-up',
      body: 'To find A: cover up its factor, then plug that factor\'s root into what is left. Watch:',
      visual: { type: 'coverup' },
      check: { prompt: 'For $\\frac{5x-1}{(x-2)(x+1)}$, cover $(x+1)$ and plug $x = -1$: $B = \\;?$', options: [
        { tex: '2', ok: true },
        { tex: '-2', msg: '$\\frac{5(-1)-1}{(-1)-2} = \\frac{-6}{-3} = 2$.' },
        { tex: '3', msg: 'That is A. For B, plug in $x = -1$.' },
      ] },
    },
    {
      title: 'Matching coefficients',
      body: 'When no root isolates a constant (quadratics, repeated factors), expand the basic equation, group by powers of $x$, and match each power. This is class Example 4.',
      visual: { type: 'reveal', lines: [
        '2x^{2} - x + 4 = A(x^{2} + 4) + (Bx + C)x',
        '= (A + B)x^{2} + Cx + 4A',
        'x^{0}:\\; 4A = 4 \\;\\Rightarrow\\; A = 1',
        'x^{1}:\\; C = -1',
        'x^{2}:\\; A + B = 2 \\;\\Rightarrow\\; B = 1',
      ] },
    },
    {
      title: 'Integrate the pieces',
      body: 'Your class\'s standard forms. Every piece is one of these.',
      visual: { type: 'tex', lines: [
        '\\int \\frac{1}{ax + b}\\,dx = \\frac{1}{a}\\ln|ax + b| + C',
        '\\int \\frac{1}{(ax + b)^{n}}\\,dx = \\frac{(ax + b)^{-n+1}}{a(-n+1)} + C \\quad (n \\ne 1)',
        '\\int \\frac{1}{x^{2} + a^{2}}\\,dx = \\frac{1}{a}\\arctan\\frac{x}{a} + C',
        '\\int \\frac{2x}{x^{2} + a^{2}}\\,dx = \\ln(x^{2} + a^{2}) + C',
      ] },
    },
    {
      title: 'The trap list',
      body: 'Points people lose on partial fractions.',
      visual: { type: 'traps', items: [
        { bad: '\\int\\frac{x^{3}+x}{x-1}dx \\text{ without dividing}', why: 'Degree check FIRST: top degree 3 ≥ 1, so long-divide.' },
        { bad: '\\int\\frac{5x-1}{x^{2}-x-2}dx = \\ln|x^{2}-x-2|', why: 'Only works when the top is the derivative of the bottom. Split first.' },
        { bad: '\\int\\frac{3}{x-2}dx = 3\\ln(x-2)', why: 'Absolute value: $3\\ln|x-2|$.' },
        { bad: 'x^{2}+4 = (x-2)(x+2)', why: 'That is $x^2 - 4$. $x^2 + 4$ does not factor.' },
        { bad: '\\int\\frac{-2x}{(x^{2}+1)^{2}}dx = -\\ln(x^{2}+1)', why: 'The squared piece is a u-sub to a power, not a log: it gives $\\frac{1}{x^2+1}$.' },
      ] },
    },
  ],
  imp: [
    {
      title: 'Two ways to be improper',
      body: 'An integral is improper when a limit is **infinite** (Type 1), or the function **blows up** somewhere on $[a, b]$ (Type 2). You cannot plug in $\\infty$, and you cannot plug in an asymptote.',
      visual: { type: 'twoKinds' },
      check: { prompt: 'Which one is improper?', options: [
        { tex: '\\int_{0}^{2}\\frac{dx}{x-1}', ok: true },
        { tex: '\\int_{2}^{5}\\frac{dx}{x-1}', msg: '$x = 1$ is outside $[2, 5]$, so nothing blows up there.' },
        { tex: '\\int_{0}^{\\pi}\\sin x\\,dx', msg: 'Finite limits and no blow-ups: a regular definite integral.' },
      ] },
    },
    {
      title: 'Infinity is a limit, not a number',
      body: 'Swap $\\infty$ for $b$, integrate from $a$ to $b$, then let $b$ run off to $\\infty$. Drag the slider: the area under $\\frac{1}{x^2}$ creeps toward 1 and never passes it. The area under $\\frac{1}{x}$ never stops growing.',
      visual: { type: 'tail' },
      check: { prompt: '$\\lim_{b\\to\\infty}\\left(1 - \\frac{1}{b}\\right) = \\;?$', options: [
        { tex: '1', ok: true },
        { tex: '\\infty', msg: '$\\frac{1}{b}$ shrinks to 0, so you are left with 1.' },
        { tex: '0', msg: 'Only the $\\frac{1}{b}$ part goes to 0.' },
      ] },
    },
    {
      title: 'Converge or diverge',
      body: 'If the limit is a real number $L$, the integral **converges** to $L$. If it is $\\pm\\infty$ or does not exist, it **diverges**. Your final answer is always one of those two sentences.',
      visual: { type: 'cards', items: [
        { label: 'Converges', tex: '\\lim = L \\;\\;(\\text{a real number})' },
        { label: 'Diverges', tex: '\\lim = \\pm\\infty \\;\\text{ or DNE}' },
      ] },
    },
    {
      title: 'Blows up at an end: sneak up on it',
      body: 'Put $t$ where the function blows up and come at it from INSIDE the interval: $t \\to a^{+}$ at the left end, $t \\to b^{-}$ at the right. Drag $t$ toward 0.',
      visual: { type: 'spike' },
      check: { prompt: '$\\int_{2}^{5}\\frac{dx}{\\sqrt{x-2}}$: which limit?', options: [
        { tex: '\\lim_{t\\to 2^{+}}\\int_{t}^{5}\\frac{dx}{\\sqrt{x-2}}', ok: true },
        { tex: '\\lim_{t\\to 2^{-}}\\int_{t}^{5}\\frac{dx}{\\sqrt{x-2}}', msg: 'Inside the interval is to the RIGHT of 2, so $t \\to 2^{+}$.' },
        { tex: '\\lim_{t\\to 5^{-}}\\int_{2}^{t}\\frac{dx}{\\sqrt{x-2}}', msg: 'The trouble is at $x = 2$ (where $\\sqrt{x-2} = 0$), not at 5.' },
      ] },
    },
    {
      title: 'Blows up inside: split it',
      body: 'The trap from class. If the bottom hits 0 BETWEEN $a$ and $b$, integrating straight across gives nonsense. Split at the bad point. If either piece diverges, the whole thing diverges.',
      visual: { type: 'splitTrap' },
    },
    {
      title: 'Both ends infinite: split at 0',
      body: 'Two trouble spots means two pieces, each with its own limit. Both must converge.',
      visual: { type: 'reveal', lines: [
        '\\int_{-\\infty}^{\\infty}\\frac{dx}{1+x^{2}} = \\int_{-\\infty}^{0}\\frac{dx}{1+x^{2}} + \\int_{0}^{\\infty}\\frac{dx}{1+x^{2}}',
        '= \\lim_{a\\to-\\infty}\\left(0 - \\arctan a\\right) + \\lim_{b\\to\\infty}\\left(\\arctan b - 0\\right)',
        '= \\frac{\\pi}{2} + \\frac{\\pi}{2} = \\pi',
        '\\text{Trap: } \\int_{-\\infty}^{\\infty} x\\,dx \\ne 0 \\;\\;(\\text{each half diverges})',
      ] },
    },
    {
      title: 'The p-test: decide in one line',
      body: 'For $\\frac{1}{x^{p}}$ out to $\\infty$ you need $p > 1$. Near 0 it FLIPS: you need $p < 1$. And $p = 1$ diverges both ways. Slide $p$ and watch both verdicts.',
      visual: { type: 'ptest' },
      check: { prompt: '$\\int_{0}^{1}\\frac{dx}{x^{3}}$:', options: [
        { text: 'Diverges ($p = 3 \\ge 1$ near 0)', ok: true },
        { text: 'Converges ($p = 3 > 1$)', msg: 'That is the rule out at $\\infty$. Near 0 it flips: $p \\ge 1$ diverges.' },
      ] },
    },
    {
      title: 'Limits you will need',
      body: 'Most improper integrals end with one of these.',
      visual: { type: 'cards', items: [
        { label: 'A number over something huge', tex: '\\frac{1}{b} \\to 0' },
        { label: 'e to a huge negative power', tex: 'e^{-b} \\to 0' },
        { label: 'Logs grow forever', tex: '\\ln b \\to \\infty' },
        { label: 'arctan levels off', tex: '\\arctan b \\to \\frac{\\pi}{2}' },
        { label: "L'Hôpital", tex: '\\frac{b}{e^{b}} \\to 0,\\;\\; \\frac{\\ln b}{b} \\to 0' },
        { label: 'Near 0 from the right', tex: '\\ln t \\to -\\infty,\\;\\; t\\ln t \\to 0' },
      ] },
    },
    {
      title: 'The trap list',
      body: 'Points people lose on improper integrals.',
      visual: { type: 'traps', items: [
        { bad: '\\int_{1}^{\\infty}\\frac{dx}{x^{2}} = \\left[-\\frac{1}{x}\\right]_{1}^{\\infty}', why: 'Never plug in $\\infty$. Use $b$ and a limit.' },
        { bad: '\\int_{-1}^{2}\\frac{dx}{x^{2}} = -\\frac{3}{2}', why: 'Asymptote at 0, inside the interval. Split there: it diverges.' },
        { bad: '\\int_{-\\infty}^{\\infty}x\\,dx = 0', why: 'Each half diverges, so the integral diverges.' },
        { bad: '\\int_{0}^{1}\\frac{dx}{x^{2}}\\;\\text{converges}', why: 'Near 0 the p-test flips: $p = 2 \\ge 1$ diverges.' },
      ] },
    },
  ],
};

/* ---------- Which Method? ---------- */
M.METHODS = [
  { key: 'usub', name: 'u-sub' },
  { key: 'ibp', name: 'By parts' },
  { key: 'trig', name: 'Trig integral' },
  { key: 'tsub', name: 'Trig sub' },
  { key: 'pf', name: 'Partial fractions' },
];
M.METHOD_TRAPS = [
  { tex: '\\int x\\,e^{x^{2}}\\,dx', ok: ['usub'], why: '$2x$ is the derivative of $x^2$, and it is sitting right there: $u = x^2$.' },
  { tex: '\\int \\frac{x}{\\sqrt{9-x^{2}}}\\,dx', ok: ['usub'], why: 'Looks like trig sub, but the $x$ on top is half the derivative of $9 - x^2$. u-sub is faster.' },
  { tex: '\\int \\frac{x}{x^{2}+4}\\,dx', ok: ['usub'], why: 'The top is half the derivative of the bottom: $\\frac12\\ln(x^2+4)$.' },
  { tex: '\\int \\frac{\\ln x}{x}\\,dx', ok: ['usub'], why: '$\\frac1x$ is the derivative of $\\ln x$, so u-sub, not parts.' },
  { tex: '\\int x\\cos(x^{2})\\,dx', ok: ['usub'], why: 'Chain rule in reverse: $u = x^2$.' },
  { tex: '\\int \\sin x\\cos x\\,dx', ok: ['usub', 'trig'], why: 'Either works: $u = \\sin x$, or $\\sin x\\cos x = \\frac12\\sin 2x$.' },
  { tex: '\\int \\frac{2x+3}{x^{2}+3x-4}\\,dx', ok: ['usub', 'pf'], why: 'The top is exactly the derivative of the bottom: $\\ln|x^2+3x-4|$. Partial fractions works too, just slower.' },
  { tex: '\\int \\frac{e^{x}}{1+e^{2x}}\\,dx', ok: ['usub'], why: '$u = e^x$ turns it into $\\int\\frac{du}{1+u^2}$.' },
  { tex: '\\int \\frac{dx}{x\\ln x}', ok: ['usub'], why: '$u = \\ln x$, $du = \\frac{dx}{x}$.' },
  { tex: '\\int x\\sqrt{x^{2}+1}\\,dx', ok: ['usub'], why: '$u = x^2+1$: the $x$ is the derivative piece.' },
  { tex: '\\int \\frac{x^{3}}{x^{4}+1}\\,dx', ok: ['usub'], why: 'The top is a quarter of the derivative of the bottom.' },
  { tex: '\\int x^{2}e^{x^{3}}\\,dx', ok: ['usub'], why: 'Looks like parts, but $x^2$ is the derivative piece of $x^3$.' },
  { tex: '\\int \\frac{\\arctan x}{1+x^{2}}\\,dx', ok: ['usub'], why: '$u = \\arctan x$, $du = \\frac{dx}{1+x^2}$.' },
  { tex: '\\int \\cos^{4}x\\,\\sin x\\,dx', ok: ['usub', 'trig'], why: 'One $\\sin x$, the rest $\\cos$: $u = \\cos x$ right away.' },
  { tex: '\\int \\frac{dx}{x^{2}-9}', ok: ['pf'], why: 'Factors as $(x-3)(x+3)$: partial fractions.' },
  { tex: '\\int \\frac{dx}{\\sqrt{x^{2}+16}}', ok: ['tsub'], why: 'Root of $x^2 + 16$, nothing to u-sub: $x = 4\\tan\\theta$.' },
  { tex: '\\int x\\ln x\\,dx', ok: ['ibp'], why: 'Two different types multiplied, no derivative pair: parts with $u = \\ln x$.' },
  { tex: '\\int e^{x}\\cos x\\,dx', ok: ['ibp'], why: 'The boomerang: parts twice.' },
  { tex: '\\int \\sin^{2}x\\,dx', ok: ['trig'], why: 'Even power: half-angle.' },
  { tex: '\\int \\frac{x+1}{x^{2}(x-1)}\\,dx', ok: ['pf'], why: 'Rational function with a factorable bottom (repeated $x$): partial fractions.' },
];
M.methodQuestion = function (rng) {
  if (rng.chance(0.42)) { const t = rng.pick(M.METHOD_TRAPS); return { tex: t.tex, ok: t.ok, why: t.why }; }
  const unit = rng.pick(['ibp', 'trig', 'tsub', 'pf']);
  const p = M.generate(unit, rng.pick([1, 1, 2]), rng);
  const ok = [unit];
  if (unit === 'trig' && ['sin_odd', 'cos_odd', 'tan_sec_even', 'tan_odd'].includes(p.family)) ok.push('usub');
  if (unit === 'pf' && p.family === 'split') ok.push('usub');
  const WHY = {
    ibp: 'Two different function types multiplied (or one function you can differentiate but not integrate): parts.',
    trig: 'Powers of trig functions: identity, then u-sub.',
    tsub: 'A root of $a^2 \\pm x^2$ or $x^2 - a^2$ with no u-sub available: trig sub.',
    pf: 'A rational function with a bottom that factors: partial fractions.',
  };
  return { tex: p.tex, ok, why: WHY[unit] };
};

/* ---------- traps: labels + patches ---------- */
M.TRAPS = {
  'formula-sign': { name: 'IBP formula sign', patch: 'Parts always subtracts: $\\int u\\,dv = uv \\mathbin{\\mathbf{-}} \\int v\\,du$.', drill: ['ibp', 'x_exp'] },
  kfactor: { name: 'Forgot the 1/k', patch: 'Integrating $e^{kx}$, $\\sin(kx)$, $\\cos(kx)$ divides by $k$. Differentiating multiplies.', drill: ['ibp', 'x_trig'] },
  'trig-sign': { name: 'Trig sign slips', patch: '$\\int\\sin = -\\cos$, $\\int\\cos = +\\sin$, $\\frac{d}{dx}\\cos = -\\sin$. The sign rides along.', drill: ['trig', 'sin_odd'] },
  plusC: { name: 'Missing +C', patch: 'Last pencil stroke on every indefinite integral: $+C$. Do not put the pencil down until it is there.', drill: null },
  abs: { name: 'Missing |absolute value|', patch: '$\\int\\frac{dx}{x-a} = \\ln|x-a|$. The bars matter.', drill: ['pf', 'distinct2'] },
  liate: { name: 'Picking u', patch: 'LIATE: Logs, Inverse trig, Algebraic, Trig, Exponential. First one on the list is $u$.', drill: ['ibp', 'xn_ln'] },
  identity: { name: 'Identity mix-ups', patch: '$\\sin^2 = \\frac{1-\\cos 2x}{2}$, $\\cos^2 = \\frac{1+\\cos 2x}{2}$, $\\tan^2 = \\sec^2 - 1$.', drill: ['trig', 'even'] },
  backsub: { name: 'Forgot to back-substitute', patch: 'The final answer must be in $x$. Replace every $u$ or $\\theta$.', drill: ['tsub', 'x2_root'] },
  power: { name: 'Power rule slips', patch: 'Add 1 to the power, then DIVIDE by the new power. Never power-rule a trig function.', drill: ['trig', 'cos_odd'] },
  rounds: { name: 'Stopped too early', patch: '$x^2$ needs 2 rounds, $x^3$ needs 3. Use the DI table and keep going until D hits 0.', drill: ['ibp', 'x2_exp'] },
  boomerang: { name: 'Boomerang algebra', patch: 'When the integral comes back, move it to the left side and solve for it.', drill: ['ibp', 'exp_trig'] },
  triangle: { name: 'Reading the triangle', patch: 'SOH CAH TOA. Label opp, adj, hyp from your substitution, then read the ratio.', drill: ['tsub', 'x2_root'] },
  'tsub-form': { name: 'Wrong substitution', patch: '$a^2 - x^2 \\to \\sin$, $a^2 + x^2 \\to \\tan$, $x^2 - a^2 \\to \\sec$.', drill: ['tsub', 'asin'] },
  constants: { name: 'Partial fraction constants', patch: 'Plug each root in fully. A goes with the factor whose root you plugged.', drill: ['pf', 'distinct2'] },
  'pf-setup': { name: 'Wrong template', patch: 'Repeated factor: one term per power. Irreducible quadratic: linear top $Bx + C$.', drill: ['pf', 'repeated'] },
  'pf-skip': { name: 'ln of the whole bottom', patch: 'Only legal when the top is the derivative of the bottom. Otherwise split first.', drill: ['pf', 'distinct2'] },
  'pf-division': { name: 'Skipped long division', patch: 'Top degree ≥ bottom degree means divide first.', drill: ['pf', 'improper'] },
  factor: { name: 'Factoring signs', patch: 'A root at $x = 3$ means the factor $(x - 3)$. Check by multiplying back.', drill: ['pf', 'distinct2'] },
  sign: { name: 'Sign errors', patch: 'Circle every minus sign as you go. Distribute minus signs to every term.', drill: null },
  usub: { name: 'u-sub mix-ups', patch: 'Check whether the derivative of the inside is sitting in the problem.', drill: ['ibp', 'arctan'] },
  direction: { name: 'Differentiated instead', patch: 'Integrate means go backwards: what function has THIS as its derivative?', drill: null },
  derivative: { name: 'Derivative slips', patch: 'Chain rule: multiply by the derivative of the inside.', drill: ['ibp', 'ln_ax'] },
  product: { name: 'Integrated factors separately', patch: '$\\int fg \\ne \\int f\\cdot\\int g$. That is why parts exists.', drill: ['ibp', 'x_exp'] },
  algebra: { name: 'Algebra slips', patch: 'Write every step plugged in fully, in parentheses, then simplify.', drill: null },
  exact: { name: 'Decimals instead of exact', patch: 'Keep $\\pi$, $e$ and $\\ln 2$ as symbols. Decimals cost points.', drill: ['ibp', 'definite'] },
  strategy: { name: 'Picking the strategy', patch: 'Check the powers: odd → save one; all even → half-angle.', drill: ['trig', 'even'] },
  'imp-type': { name: 'Spotting improper integrals', patch: 'Two scans every time: are the limits $\\pm\\infty$? Does anything in $[a, b]$ make the bottom 0?', drill: ['imp', 'interior'] },
  'imp-setup': { name: 'Plugged in ∞ or the asymptote', patch: 'Swap every trouble spot for a letter and take a limit. Approach from INSIDE the interval.', drill: ['imp', 'p_inf'] },
  'imp-split': { name: 'Forgot to split', patch: 'Both ends infinite: split at 0. Asymptote inside $[a, b]$: split there. Any piece diverges means the whole thing diverges.', drill: ['imp', 'interior'] },
  'imp-limit': { name: 'Limit slips', patch: '$\\frac{1}{b} \\to 0$, $e^{-b} \\to 0$, $\\ln b \\to \\infty$, $\\arctan b \\to \\frac{\\pi}{2}$. Combine logs BEFORE the limit.', drill: ['imp', 'exp_inf'] },
  'imp-plug': { name: 'Dropped the bottom limit', patch: 'Top minus bottom: subtract $F(a)$ even when the top part goes to 0.', drill: ['imp', 'arctan_inf'] },
  'imp-value': { name: 'Converges, but no number', patch: 'If it converges, finish the job: say what it converges TO.', drill: ['imp', 'p_inf'] },
  'p-test': { name: 'p-test direction', patch: 'Out to $\\infty$: converges if $p > 1$. Near 0: converges if $p < 1$. $p = 1$ diverges both ways.', drill: ['imp', 'p_zero'] },
};
})(typeof globalThis !== 'undefined' ? globalThis : this);
