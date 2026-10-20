/* ==========================================================================
   STUDY GUIDE — a step list for every scenario, 7.1–7.4 and 7.8.
   Each scenario: how to spot it, the steps (with a worked example fully
   plugged in at every step), the trap, and the generator families that
   "Try one" pulls from. 7.4 and 7.8 follow the class notes.
   Colors in the math: hu = pink (the piece you save / u), hv = lavender,
   hd = mint, hk = butter, hbad = red.
   ========================================================================== */
(function (G) {
'use strict';
const M = G.M;
const X = String.raw;
const pk = (s) => X`\htmlClass{hu}{${s}}`, lv = (s) => X`\htmlClass{hv}{${s}}`, mt = (s) => X`\htmlClass{hd}{${s}}`, bt = (s) => X`\htmlClass{hk}{${s}}`;

M.GUIDE = {
  /* ------------------------------------------------------------------ 7.1 */
  ibp: {
    big: X`Parts undoes the product rule. You trade the integral you have for one that is easier.`,
    formula: X`\int ${pk(X`u`)}\,${lv(X`dv`)} = ${pk(X`u`)}${lv(X`v`)} - \int ${lv(X`v`)}\,${mt(X`du`)}`,
    recipe: [
      { t: 'Pick u with LIATE', d: X`Logs, Inverse trig, Algebraic, Trig, Exponential. The first one on the list is $u$. Everything else (with $dx$) is $dv$.` },
      { t: 'Find du and v', d: X`Differentiate $u$. Integrate $dv$.` },
      { t: 'Plug into uv − ∫v du', d: 'Everything in parentheses, fully plugged in, before you simplify.' },
      { t: 'Integrate what is left', d: 'It should be easier. If it still has a power of x, go again (or use the DI table).' },
      { t: 'Simplify, then + C', d: '' },
    ],
    visual: { type: 'liate' },
    scenarios: [
      {
        key: 'poly_exp_trig', name: 'x times eˣ, sin, or cos', spot: X`A plain $x$ (or $2x$) multiplied by $e^{kx}$, $\sin kx$, or $\cos kx$.`,
        pattern: X`\int ${pk(X`x`)}\cdot ${lv(X`e^{kx}`)}\,dx`, families: ['x_exp', 'x_trig', 'x_sec2'],
        example: X`\int x\,e^{2x}\,dx`,
        steps: [
          { t: 'Pick u and dv', d: X`LIATE: $x$ is Algebraic, so it beats Exponential.`, m: [X`${pk(X`u = x`)} \qquad ${lv(X`dv = e^{2x}\,dx`)}`] },
          { t: 'Find du and v', d: X`Differentiate $u$. Integrate $dv$, and divide by the 2 next to $x$.`, m: [X`${mt(X`du = dx`)} \qquad ${lv(X`v = \tfrac{1}{2}e^{2x}`)}`] },
          { t: 'Plug into uv − ∫v du', d: 'Parentheses around every piece. Simplify after.', m: [X`\int x\,e^{2x}\,dx = ${pk(X`(x)`)}${lv(X`\left(\tfrac{1}{2}e^{2x}\right)`)} - \int ${lv(X`\left(\tfrac{1}{2}e^{2x}\right)`)}${mt(X`dx`)}`] },
          { t: 'Do the easier integral', d: X`Pull out the $\tfrac{1}{2}$, then integrate $e^{2x}$ (divide by 2 again).`, m: [X`\int \tfrac{1}{2}e^{2x}\,dx = \tfrac{1}{4}e^{2x}`] },
          { t: 'Combine, then + C', d: '', m: [X`= \tfrac{1}{2}x\,e^{2x} - \tfrac{1}{4}e^{2x} + C`] },
        ],
        trap: X`Integrating $e^{2x}$ DIVIDES by 2: $\tfrac{1}{2}e^{2x}$. Multiplying by 2 is what differentiating does.`,
        visual: { type: 'box', u: 'x', dv: X`e^{2x}\,dx`, du: 'dx', v: X`\tfrac{1}{2}e^{2x}`, result: X`\int x e^{2x}dx = \tfrac{1}{2}xe^{2x} - \int\tfrac{1}{2}e^{2x}dx = \tfrac{1}{2}xe^{2x} - \tfrac{1}{4}e^{2x} + C` },
        verify: { f: (x) => x * Math.exp(2 * x), F: (x) => (x * Math.exp(2 * x)) / 2 - Math.exp(2 * x) / 4, dom: [-1, 1] },
      },
      {
        key: 'tabular', name: 'x² or x³ times eˣ, sin, or cos', spot: X`A power like $x^2$ or $x^3$ times $e^{kx}$, $\sin$, or $\cos$. Parts more than once: use the DI table.`,
        pattern: X`\int ${pk(X`x^{2}`)}\cdot ${lv(X`e^{x}`)}\,dx`, families: ['x2_exp', 'x2_trig', 'x3_exp'],
        example: X`\int x^{2}e^{x}\,dx`,
        steps: [
          { t: 'Make two columns', d: 'D gets the power of x. I gets the other function.', m: [X`\text{D: } ${pk(X`x^{2}`)} \qquad \text{I: } ${lv(X`e^{x}`)}`] },
          { t: 'Differentiate down D until 0', d: '', m: [X`${pk(X`x^{2}`)} \to ${pk(X`2x`)} \to ${pk(X`2`)} \to ${pk(X`0`)}`] },
          { t: 'Integrate down I the same number of times', d: '', m: [X`${lv(X`e^{x}`)} \to ${lv(X`e^{x}`)} \to ${lv(X`e^{x}`)} \to ${lv(X`e^{x}`)}`] },
          { t: 'Multiply along the diagonals: + − +', d: 'Signs alternate, starting with +.', m: [X`(+)\,x^{2}e^{x} \qquad (-)\,2x\,e^{x} \qquad (+)\,2e^{x}`] },
          { t: 'Add them up, then + C', d: '', m: [X`\int x^{2}e^{x}\,dx = x^{2}e^{x} - 2x\,e^{x} + 2e^{x} + C`] },
        ],
        trap: X`The signs alternate $+, -, +, -$. With $\sin$ or $\cos$ the I column also flips signs: $\sin \to -\cos \to -\sin \to \cos$.`,
        visual: { type: 'di' },
        verify: { f: (x) => x * x * Math.exp(x), F: (x) => (x * x - 2 * x + 2) * Math.exp(x), dom: [-1, 1.5] },
      },
      {
        key: 'log_inv', name: 'ln x or inverse trig', spot: X`$\ln x$, $\arctan x$, or $\arcsin x$, alone or times a power of $x$. The log/inverse trig is always $u$.`,
        pattern: X`\int ${lv(X`x^{n}`)}\cdot ${pk(X`\ln x`)}\,dx`, families: ['ln_ax', 'xn_ln', 'arctan', 'arcsin', 'ln2'],
        example: X`\int x\ln x\,dx`,
        steps: [
          { t: 'Pick u = the log', d: X`$\ln x$ is first in LIATE. It is easy to differentiate and hard to integrate.`, m: [X`${pk(X`u = \ln x`)} \qquad ${lv(X`dv = x\,dx`)}`] },
          { t: 'Find du and v', d: '', m: [X`${mt(X`du = \frac{1}{x}\,dx`)} \qquad ${lv(X`v = \frac{x^{2}}{2}`)}`] },
          { t: 'Plug into uv − ∫v du', d: '', m: [X`\int x\ln x\,dx = ${pk(X`(\ln x)`)}${lv(X`\left(\frac{x^{2}}{2}\right)`)} - \int ${lv(X`\frac{x^{2}}{2}`)}\cdot ${mt(X`\frac{1}{x}\,dx`)}`] },
          { t: 'Simplify the leftover, integrate', d: X`The $\frac{1}{x}$ cancels one $x$. The log is gone.`, m: [X`\int \frac{x}{2}\,dx = \frac{x^{2}}{4}`] },
          { t: 'Combine, then + C', d: X`Just $\ln x$ by itself? Use $dv = dx$: $\int\ln x\,dx = x\ln x - x + C$.`, m: [X`= \frac{x^{2}}{2}\ln x - \frac{x^{2}}{4} + C`] },
        ],
        trap: X`Do NOT pick $u = x$ here. The log has to be $u$, because you cannot easily integrate $\ln x$.`,
        visual: { type: 'box', u: X`\ln x`, dv: X`x\,dx`, du: X`\tfrac{1}{x}dx`, v: X`\tfrac{x^{2}}{2}`, result: X`\int x\ln x\,dx = \tfrac{x^{2}}{2}\ln x - \int\tfrac{x}{2}dx = \tfrac{x^{2}}{2}\ln x - \tfrac{x^{2}}{4} + C` },
        verify: { f: (x) => x * Math.log(x), F: (x) => (x * x / 2) * Math.log(x) - x * x / 4, dom: [0.5, 3] },
      },
      {
        key: 'loop', name: 'eˣ times sin or cos (the loop)', spot: X`$e^{kx}$ times $\sin$ or $\cos$. Nothing ever dies, so the integral comes back.`,
        pattern: X`\int ${lv(X`e^{x}`)}\cdot ${pk(X`\sin x`)}\,dx`, families: ['exp_trig'],
        example: X`\int e^{x}\sin x\,dx`,
        steps: [
          { t: 'Name it I, pick u = the trig', d: '', m: [X`${bt(X`I`)} = \int e^{x}\sin x\,dx \qquad ${pk(X`u = \sin x`)},\; ${lv(X`dv = e^{x}dx`)}`] },
          { t: 'Parts once', d: '', m: [X`${bt(X`I`)} = e^{x}\sin x - \int e^{x}\cos x\,dx`] },
          { t: 'Parts again, SAME choice (u = trig)', d: X`$u = \cos x$, $du = -\sin x\,dx$. The two minuses make a plus.`, m: [X`\int e^{x}\cos x\,dx = e^{x}\cos x + \int e^{x}\sin x\,dx = e^{x}\cos x + ${bt(X`I`)}`] },
          { t: 'I came back: substitute', d: '', m: [X`${bt(X`I`)} = e^{x}\sin x - \left(e^{x}\cos x + ${bt(X`I`)}\right) = e^{x}\sin x - e^{x}\cos x - ${bt(X`I`)}`] },
          { t: 'Solve for I like algebra, then + C', d: X`Move the $I$ to the left: $2I$. Divide by 2.`, m: [X`2${bt(X`I`)} = e^{x}(\sin x - \cos x) \;\Rightarrow\; ${bt(X`I`)} = \tfrac{1}{2}e^{x}(\sin x - \cos x) + C`] },
        ],
        trap: 'Keep the SAME choice (u = trig) on round 2. Switching undoes round 1 and you go in a circle.',
        visual: { type: 'boomerang' },
        verify: { f: (x) => Math.exp(x) * Math.sin(x), F: (x) => 0.5 * Math.exp(x) * (Math.sin(x) - Math.cos(x)), dom: [-1, 1.5] },
      },
      {
        key: 'definite_ibp', name: 'With limits (definite)', spot: 'Any parts problem with numbers on the integral sign.',
        pattern: X`\int_{a}^{b} ${pk(X`u`)}\,${lv(X`dv`)} = \left[${pk(X`u`)}${lv(X`v`)}\right]_{a}^{b} - \int_{a}^{b} ${lv(X`v`)}\,${mt(X`du`)}`, families: ['definite'],
        example: X`\int_{0}^{1} x\,e^{x}\,dx`,
        steps: [
          { t: 'Do parts like normal', d: '', m: [X`${pk(X`u = x`)},\; ${lv(X`dv = e^{x}dx`)} \;\Rightarrow\; ${mt(X`du = dx`)},\; ${lv(X`v = e^{x}`)}`] },
          { t: 'Antiderivative (no + C needed)', d: X`The $+C$ cancels when you subtract.`, m: [X`\int x\,e^{x}\,dx = x\,e^{x} - e^{x}`] },
          { t: 'Plug in top, then bottom', d: 'Both fully plugged in, each in parentheses.', m: [X`\left[x e^{x} - e^{x}\right]_{0}^{1} = \left(1\cdot e^{1} - e^{1}\right) - \left(0\cdot e^{0} - e^{0}\right)`] },
          { t: 'Simplify, keep it exact', d: '', m: [X`= 0 - (-1) = 1`] },
        ],
        trap: X`Subtract the WHOLE bottom value: $(0 - 1) = -1$, and minus $-1$ is $+1$.`,
        verify: { f: (x) => x * Math.exp(x), F: (x) => x * Math.exp(x) - Math.exp(x), lo: 0, hi: 1, value: 1 },
      },
    ],
  },

  /* ------------------------------------------------------------------ 7.2 */
  trig: {
    big: 'Look at the powers first. Odd power: save one. All even: half-angle. Different angles: product to sum.',
    formula: X`\sin^{2}x + \cos^{2}x = 1 \qquad 1 + \tan^{2}x = \sec^{2}x`,
    recipe: [
      { t: 'Check the powers', d: 'Odd power? Save one. All even? Half-angle. Different angles? Product to sum.' },
      { t: 'Save one factor for du', d: X`$\sin x$, $\cos x$, $\sec^2 x$, or $\sec x\tan x$.` },
      { t: 'Convert the rest with an identity', d: X`$\sin^2 = 1 - \cos^2$, $\cos^2 = 1 - \sin^2$, $\sec^2 = 1 + \tan^2$, $\tan^2 = \sec^2 - 1$.` },
      { t: 'u-sub and integrate', d: 'Now it is a plain polynomial in u.' },
      { t: 'Back to x, then + C', d: '' },
    ],
    visual: { type: 'flow' },
    scenarios: [
      {
        key: 'sin_odd', name: 'Power of sin is odd', spot: X`$\int\sin^{m}x\cos^{n}x\,dx$ with $m$ odd (like $\sin^3$, $\sin^5$).`,
        pattern: X`\int \sin^{${pk(X`\text{odd}`)}}x\,\cos^{n}x\,dx`, families: ['sin_odd'],
        example: X`\int \sin^{3}x\cos^{2}x\,dx`,
        steps: [
          { t: 'Save one sin x', d: 'The sin power (3) is odd. Peel one off for du.', m: [X`\int \sin^{2}x\cos^{2}x\cdot ${pk(X`\sin x`)}\,dx`] },
          { t: 'Turn the rest into cos', d: X`$\sin^2 x = 1 - \cos^2 x$.`, m: [X`= \int (1-\cos^{2}x)\cos^{2}x\,${pk(X`\sin x`)}\,dx`] },
          { t: 'u = cos x', d: X`$du = -\sin x\,dx$, so $\sin x\,dx = -du$. Keep the minus.`, m: [X`u = \cos x,\quad ${pk(X`\sin x\,dx = -du`)}`, X`= -\int (1-u^{2})u^{2}\,du = -\int (u^{2} - u^{4})\,du`] },
          { t: 'Integrate', d: '', m: [X`= -\frac{u^{3}}{3} + \frac{u^{5}}{5}`] },
          { t: 'Back to x, then + C', d: '', m: [X`= -\frac{\cos^{3}x}{3} + \frac{\cos^{5}x}{5} + C`] },
        ],
        trap: X`$du = -\sin x\,dx$. That minus flips every sign in the answer.`,
        verify: { f: (x) => Math.sin(x) ** 3 * Math.cos(x) ** 2, F: (x) => -(Math.cos(x) ** 3) / 3 + Math.cos(x) ** 5 / 5, dom: [-1.2, 1.2] },
      },
      {
        key: 'cos_odd', name: 'Power of cos is odd', spot: X`$\int\sin^{m}x\cos^{n}x\,dx$ with $n$ odd (like $\cos^3$, $\cos^5$).`,
        pattern: X`\int \sin^{m}x\,\cos^{${pk(X`\text{odd}`)}}x\,dx`, families: ['cos_odd'],
        example: X`\int \sin^{2}x\cos^{3}x\,dx`,
        steps: [
          { t: 'Save one cos x', d: 'The cos power (3) is odd. Peel one off for du.', m: [X`\int \sin^{2}x\cos^{2}x\cdot ${pk(X`\cos x`)}\,dx`] },
          { t: 'Turn the rest into sin', d: X`$\cos^2 x = 1 - \sin^2 x$.`, m: [X`= \int \sin^{2}x\,(1-\sin^{2}x)\,${pk(X`\cos x`)}\,dx`] },
          { t: 'u = sin x', d: X`$du = \cos x\,dx$. No minus this time.`, m: [X`u = \sin x,\quad ${pk(X`du = \cos x\,dx`)}`, X`= \int u^{2}(1-u^{2})\,du = \int (u^{2} - u^{4})\,du`] },
          { t: 'Integrate', d: '', m: [X`= \frac{u^{3}}{3} - \frac{u^{5}}{5}`] },
          { t: 'Back to x, then + C', d: '', m: [X`= \frac{\sin^{3}x}{3} - \frac{\sin^{5}x}{5} + C`] },
        ],
        trap: 'Save from the ODD power. If both powers are odd, either one works (pick the smaller).',
        verify: { f: (x) => Math.sin(x) ** 2 * Math.cos(x) ** 3, F: (x) => Math.sin(x) ** 3 / 3 - Math.sin(x) ** 5 / 5, dom: [-1.2, 1.2] },
      },
      {
        key: 'even', name: 'Both powers even', spot: X`Only even powers, like $\sin^2 x$, $\cos^2 x$, $\sin^2x\cos^2x$, $\cos^4 x$.`,
        pattern: X`\int \sin^{${pk(X`\text{even}`)}}x\,\cos^{${pk(X`\text{even}`)}}x\,dx`, families: ['even'],
        example: X`\int \sin^{2}x\,dx`,
        steps: [
          { t: 'Use the half-angle identity', d: X`$\sin^2$ gets the MINUS, $\cos^2$ gets the plus.`, m: [X`${pk(X`\sin^{2}x = \frac{1 - \cos 2x}{2}`)}`] },
          { t: 'Rewrite the integral', d: '', m: [X`\int \sin^{2}x\,dx = \int \left(\frac{1}{2} - \frac{1}{2}\cos 2x\right)dx`] },
          { t: 'Integrate each piece', d: X`$\int\cos 2x\,dx = \frac{1}{2}\sin 2x$: divide by the 2.`, m: [X`= \frac{x}{2} - \frac{1}{2}\cdot\frac{\sin 2x}{2}`] },
          { t: 'Simplify, then + C', d: '', m: [X`= \frac{x}{2} - \frac{\sin 2x}{4} + C`] },
        ],
        trap: X`Higher even powers ($\cos^4 x$)? Square the identity, then use it again on any $\cos^2 2x$.`,
        visual: { type: 'halfwave' },
        verify: { f: (x) => Math.sin(x) ** 2, F: (x) => x / 2 - Math.sin(2 * x) / 4, dom: [-1.5, 1.5] },
      },
      {
        key: 'sec_even', name: 'tan & sec: sec power even', spot: X`$\int\tan^{m}x\sec^{n}x\,dx$ with $n$ even (like $\sec^2$, $\sec^4$).`,
        pattern: X`\int \tan^{m}x\,\sec^{${pk(X`\text{even}`)}}x\,dx`, families: ['tan_sec_even'],
        example: X`\int \tan^{2}x\sec^{4}x\,dx`,
        steps: [
          { t: 'Save sec² x', d: X`$\frac{d}{dx}\tan x = \sec^2 x$, so $\sec^2 x$ is the du piece.`, m: [X`\int \tan^{2}x\sec^{2}x\cdot ${pk(X`\sec^{2}x`)}\,dx`] },
          { t: 'Turn the rest into tan', d: X`$\sec^2 x = 1 + \tan^2 x$.`, m: [X`= \int \tan^{2}x\,(1+\tan^{2}x)\,${pk(X`\sec^{2}x`)}\,dx`] },
          { t: 'u = tan x', d: '', m: [X`u = \tan x,\quad ${pk(X`du = \sec^{2}x\,dx`)}`, X`= \int (u^{2} + u^{4})\,du`] },
          { t: 'Integrate', d: '', m: [X`= \frac{u^{3}}{3} + \frac{u^{5}}{5}`] },
          { t: 'Back to x, then + C', d: '', m: [X`= \frac{\tan^{3}x}{3} + \frac{\tan^{5}x}{5} + C`] },
        ],
        trap: X`This only works when the sec power is even. If it is odd, check whether the tan power is odd.`,
        verify: { f: (x) => Math.tan(x) ** 2 / Math.cos(x) ** 4, F: (x) => Math.tan(x) ** 3 / 3 + Math.tan(x) ** 5 / 5, dom: [-1, 1] },
      },
      {
        key: 'tan_odd', name: 'tan & sec: tan power odd', spot: X`$\int\tan^{m}x\sec^{n}x\,dx$ with $m$ odd (like $\tan^3$).`,
        pattern: X`\int \tan^{${pk(X`\text{odd}`)}}x\,\sec^{n}x\,dx`, families: ['tan_odd'],
        example: X`\int \tan^{3}x\sec^{3}x\,dx`,
        steps: [
          { t: 'Save sec x tan x', d: X`$\frac{d}{dx}\sec x = \sec x\tan x$.`, m: [X`\int \tan^{2}x\sec^{2}x\cdot ${pk(X`\sec x\tan x`)}\,dx`] },
          { t: 'Turn the rest into sec', d: X`$\tan^2 x = \sec^2 x - 1$.`, m: [X`= \int (\sec^{2}x - 1)\sec^{2}x\,${pk(X`\sec x\tan x`)}\,dx`] },
          { t: 'u = sec x', d: '', m: [X`u = \sec x,\quad ${pk(X`du = \sec x\tan x\,dx`)}`, X`= \int (u^{2} - 1)u^{2}\,du = \int (u^{4} - u^{2})\,du`] },
          { t: 'Integrate', d: '', m: [X`= \frac{u^{5}}{5} - \frac{u^{3}}{3}`] },
          { t: 'Back to x, then + C', d: '', m: [X`= \frac{\sec^{5}x}{5} - \frac{\sec^{3}x}{3} + C`] },
        ],
        trap: X`$\tan^2 x = \sec^2 x - 1$: MINUS 1, not plus.`,
        verify: { f: (x) => Math.tan(x) ** 3 / Math.cos(x) ** 3, F: (x) => 1 / (5 * Math.cos(x) ** 5) - 1 / (3 * Math.cos(x) ** 3), dom: [-1, 1] },
      },
      {
        key: 'diff_angles', name: 'Different angles', spot: X`Two trig functions with different angles, like $\sin 4x\cos 5x$.`,
        pattern: X`\int \sin(${pk(X`m`)}x)\cos(${lv(X`n`)}x)\,dx`, families: ['prod'],
        example: X`\int \sin 4x\cos 5x\,dx`,
        steps: [
          { t: 'Pick the product-to-sum formula', d: '', m: [X`\sin A\cos B = \tfrac{1}{2}\left[\sin(A - B) + \sin(A + B)\right]`] },
          { t: 'Plug in A = 4x, B = 5x', g: 'Plug in A and B', d: '', m: [X`\sin 4x\cos 5x = \tfrac{1}{2}\left[\sin(4x - 5x) + \sin(4x + 5x)\right] = \tfrac{1}{2}\left[\sin(-x) + \sin 9x\right]`] },
          { t: 'Clean up the sign', d: X`Sine is odd: $\sin(-x) = -\sin x$.`, m: [X`= \tfrac{1}{2}\left[-\sin x + \sin 9x\right]`] },
          { t: 'Integrate each piece', d: X`$\int\sin kx\,dx = -\frac{1}{k}\cos kx$.`, m: [X`\int \tfrac{1}{2}\left[-\sin x + \sin 9x\right]dx = \tfrac{1}{2}\left[\cos x - \tfrac{1}{9}\cos 9x\right]`] },
          { t: 'Simplify, then + C', d: '', m: [X`= \tfrac{1}{2}\cos x - \tfrac{1}{18}\cos 9x + C`] },
        ],
        trap: X`$\sin(-x) = -\sin x$, but $\cos(-x) = +\cos x$.`,
        visual: { type: 'tex', lines: [X`\sin A\cos B = \tfrac{1}{2}[\sin(A-B) + \sin(A+B)]`, X`\sin A\sin B = \tfrac{1}{2}[\cos(A-B) - \cos(A+B)]`, X`\cos A\cos B = \tfrac{1}{2}[\cos(A-B) + \cos(A+B)]`] },
        verify: { f: (x) => Math.sin(4 * x) * Math.cos(5 * x), F: (x) => Math.cos(x) / 2 - Math.cos(9 * x) / 18, dom: [-1.5, 1.5] },
      },
      {
        key: 'special', name: 'tan, sec, or tan² by itself', spot: X`One lonely trig function: $\tan^2 x$, $\tan x$, $\sec x$, $\cot x$.`,
        pattern: X`\int ${pk(X`\tan^{2}x`)}\,dx`, families: ['special'],
        example: X`\int \tan^{2}x\,dx`,
        steps: [
          { t: 'Swap with the identity', d: '', m: [X`${pk(X`\tan^{2}x = \sec^{2}x - 1`)}`] },
          { t: 'Integrate each piece, + C', d: X`$\int\sec^2 x\,dx = \tan x$.`, m: [X`\int(\sec^{2}x - 1)\,dx = \tan x - x + C`] },
          { t: 'Know these cold', d: 'They show up inside bigger problems.', m: [X`\int\tan x\,dx = \ln|\sec x| + C`, X`\int\sec x\,dx = \ln|\sec x + \tan x| + C`, X`\int\cot x\,dx = \ln|\sin x| + C`] },
        ],
        trap: X`No power rule on trig: $\int\tan^2 x\,dx$ is NOT $\frac{\tan^3 x}{3}$.`,
        verify: { f: (x) => Math.tan(x) ** 2, F: (x) => Math.tan(x) - x, dom: [-1, 1] },
      },
    ],
  },

  /* ------------------------------------------------------------------ 7.3 */
  tsub: {
    big: 'A root that will not cancel becomes a perfect square once x is a trig function.',
    formula: X`\sqrt{a^{2}-x^{2}}: x = a\sin\theta \quad \sqrt{a^{2}+x^{2}}: x = a\tan\theta \quad \sqrt{x^{2}-a^{2}}: x = a\sec\theta`,
    recipe: [
      { t: 'Match the shape, pick the sub', d: X`$a^2 - x^2 \to a\sin\theta$, $a^2 + x^2 \to a\tan\theta$, $x^2 - a^2 \to a\sec\theta$.` },
      { t: 'Find dx', d: 'Differentiate your substitution.' },
      { t: 'Kill the root with the identity', d: 'The root becomes one clean trig term.' },
      { t: 'Plug everything in, integrate in θ', d: 'Cancel first. It usually becomes a 7.2 problem.' },
      { t: 'Triangle back to x, then + C', d: 'Label opp, adj, hyp from your sub. SOH CAH TOA.' },
    ],
    visual: { type: 'triangles' },
    scenarios: [
      {
        key: 'sin_form', name: '√(a² − x²): x = a sin θ', spot: X`A number MINUS $x^2$ under a root (or to the $\frac{3}{2}$).`,
        pattern: X`\sqrt{${pk(X`a^{2}`)} - x^{2}}`, families: ['asin', 'sqrt_area'],
        example: X`\int \frac{dx}{x^{2}\sqrt{4 - x^{2}}}`,
        steps: [
          { t: 'Match the shape', d: X`$a^2 = 4$, so $a = 2$. Number minus $x^2$ means sine.`, m: [X`\sqrt{4 - x^{2}} \;\Rightarrow\; ${pk(X`x = 2\sin\theta`)}`] },
          { t: 'Find dx and kill the root', d: X`$1 - \sin^2\theta = \cos^2\theta$.`, m: [X`dx = 2\cos\theta\,d\theta`, X`\sqrt{4 - 4\sin^{2}\theta} = \sqrt{4\cos^{2}\theta} = 2\cos\theta`] },
          { t: 'Plug everything in', d: 'Everything in θ. Then cancel.', m: [X`\int \frac{2\cos\theta\,d\theta}{(4\sin^{2}\theta)(2\cos\theta)} = \frac{1}{4}\int \csc^{2}\theta\,d\theta`] },
          { t: 'Integrate in θ', d: '', m: [X`= -\frac{1}{4}\cot\theta`] },
          { t: 'Triangle back to x, then + C', d: X`$\sin\theta = \frac{x}{2}$: opposite $x$, hypotenuse 2, adjacent $\sqrt{4 - x^2}$.`, m: [X`\cot\theta = \frac{\text{adj}}{\text{opp}} = \frac{\sqrt{4 - x^{2}}}{x}`, X`= -\frac{\sqrt{4 - x^{2}}}{4x} + C`] },
        ],
        trap: X`Do not forget $dx = 2\cos\theta\,d\theta$. And $a$ is the SQUARE ROOT of the number: $\sqrt{4} = 2$.`,
        visual: { type: 'tri', opp: 'x', adj: X`\sqrt{4-x^{2}}`, hyp: '2', hi: ['opp', 'hyp'] },
        verify: { f: (x) => 1 / (x * x * Math.sqrt(4 - x * x)), F: (x) => -Math.sqrt(4 - x * x) / (4 * x), dom: [0.5, 1.8] },
      },
      {
        key: 'tan_form', name: '√(a² + x²): x = a tan θ', spot: X`$x^2$ PLUS a number under a root (or to the $\frac{3}{2}$).`,
        pattern: X`\sqrt{x^{2} + ${pk(X`a^{2}`)}}`, families: ['atan', 'ln_plus'],
        example: X`\int \frac{dx}{\sqrt{x^{2} + 4}}`,
        steps: [
          { t: 'Match the shape', d: X`$a^2 = 4$, so $a = 2$. Plus means tangent.`, m: [X`\sqrt{x^{2} + 4} \;\Rightarrow\; ${pk(X`x = 2\tan\theta`)}`] },
          { t: 'Find dx and kill the root', d: X`$\tan^2\theta + 1 = \sec^2\theta$.`, m: [X`dx = 2\sec^{2}\theta\,d\theta`, X`\sqrt{4\tan^{2}\theta + 4} = \sqrt{4\sec^{2}\theta} = 2\sec\theta`] },
          { t: 'Plug everything in', d: '', m: [X`\int \frac{2\sec^{2}\theta\,d\theta}{2\sec\theta} = \int \sec\theta\,d\theta`] },
          { t: 'Integrate in θ', d: '', m: [X`= \ln|\sec\theta + \tan\theta|`] },
          { t: 'Triangle back to x, then + C', d: X`$\tan\theta = \frac{x}{2}$: opposite $x$, adjacent 2, hypotenuse $\sqrt{x^2+4}$. The $-\ln 2$ from the bottom joins the $+C$.`, m: [X`\sec\theta = \frac{\sqrt{x^{2}+4}}{2},\quad \tan\theta = \frac{x}{2}`, X`= \ln\left|x + \sqrt{x^{2}+4}\right| + C`] },
        ],
        trap: X`No root, just $\frac{1}{x^2 + a^2}$? Skip the triangle: $\int\frac{dx}{x^2+a^2} = \frac{1}{a}\arctan\frac{x}{a}$.`,
        visual: { type: 'tri', opp: 'x', adj: '2', hyp: X`\sqrt{x^{2}+4}`, hi: ['opp', 'adj'] },
        verify: { f: (x) => 1 / Math.sqrt(x * x + 4), F: (x) => Math.log(x + Math.sqrt(x * x + 4)), dom: [-2, 2] },
      },
      {
        key: 'sec_form', name: '√(x² − a²): x = a sec θ', spot: X`$x^2$ MINUS a number under a root.`,
        pattern: X`\sqrt{x^{2} - ${pk(X`a^{2}`)}}`, families: ['ln_minus', 'sqrt_over_x'],
        example: X`\int \frac{\sqrt{x^{2} - 9}}{x}\,dx`,
        steps: [
          { t: 'Match the shape', d: X`$a^2 = 9$, so $a = 3$. $x^2$ minus a number means secant.`, m: [X`\sqrt{x^{2} - 9} \;\Rightarrow\; ${pk(X`x = 3\sec\theta`)}`] },
          { t: 'Find dx and kill the root', d: X`$\sec^2\theta - 1 = \tan^2\theta$.`, m: [X`dx = 3\sec\theta\tan\theta\,d\theta`, X`\sqrt{9\sec^{2}\theta - 9} = \sqrt{9\tan^{2}\theta} = 3\tan\theta`] },
          { t: 'Plug everything in', d: '', m: [X`\int \frac{3\tan\theta}{3\sec\theta}\cdot 3\sec\theta\tan\theta\,d\theta = \int 3\tan^{2}\theta\,d\theta`] },
          { t: 'Integrate in θ', d: X`$\tan^2\theta = \sec^2\theta - 1$.`, m: [X`= 3\int(\sec^{2}\theta - 1)\,d\theta = 3\tan\theta - 3\theta`] },
          { t: 'Triangle back to x, then + C', d: X`$\sec\theta = \frac{x}{3}$: hypotenuse $x$, adjacent 3, opposite $\sqrt{x^2 - 9}$.`, m: [X`\tan\theta = \frac{\sqrt{x^{2}-9}}{3},\quad \theta = \operatorname{arcsec}\frac{x}{3}`, X`= \sqrt{x^{2} - 9} - 3\operatorname{arcsec}\frac{x}{3} + C`] },
        ],
        trap: X`$\sec\theta = \frac{x}{a}$ puts $x$ on the HYPOTENUSE.`,
        visual: { type: 'tri', opp: X`\sqrt{x^{2}-9}`, adj: '3', hyp: 'x', hi: ['hyp', 'adj'] },
        verify: { f: (x) => Math.sqrt(x * x - 9) / x, F: (x) => Math.sqrt(x * x - 9) - 3 * Math.acos(3 / x), dom: [3.5, 6] },
      },
      {
        key: 'complete_sq', name: 'x² + bx + c: complete the square', spot: X`A quadratic with an $x$ term, like $x^2 + 4x + 13$, under a root or on the bottom.`,
        pattern: X`x^{2} + ${pk(X`b`)}x + c`, families: ['complete_sq'],
        example: X`\int \frac{dx}{x^{2} + 4x + 13}`,
        steps: [
          { t: 'Complete the square', d: X`Half of 4 is 2, and $2^2 = 4$. Borrow the 4 from the 13.`, m: [X`x^{2} + 4x + 13 = (x^{2} + 4x + ${pk(X`4`)}) + 9 = (x + 2)^{2} + 3^{2}`] },
          { t: 'Shift with u = x + 2', g: 'Shift: u = x + (half of b)', d: '', m: [X`u = x + 2,\quad du = dx`, X`\int \frac{dx}{(x+2)^{2} + 9} = \int \frac{du}{u^{2} + 3^{2}}`] },
          { t: 'Use the shape (here: arctan)', g: 'Use the matching shape', d: X`It is the $a^2 + u^2$ shape with $a = 3$.`, m: [X`\int\frac{du}{u^{2}+a^{2}} = \frac{1}{a}\arctan\frac{u}{a} = \frac{1}{3}\arctan\frac{u}{3}`] },
          { t: 'Put x back, then + C', d: '', m: [X`= \frac{1}{3}\arctan\left(\frac{x + 2}{3}\right) + C`] },
        ],
        trap: X`Balance it: $x^2 + 4x + 13 = (x+2)^2 + 9$, not $(x+2)^2 + 13$.`,
        verify: { f: (x) => 1 / (x * x + 4 * x + 13), F: (x) => Math.atan((x + 2) / 3) / 3, dom: [-3, 2] },
      },
      {
        key: 'pow32', name: '(a² ± x²) to the 3/2', spot: X`A power of $\frac{3}{2}$: that is a root, cubed.`,
        pattern: X`\left(x^{2} + ${pk(X`a^{2}`)}\right)^{3/2}`, families: ['pow32'],
        example: X`\int \frac{dx}{(x^{2} + 1)^{3/2}}`,
        steps: [
          { t: 'Match the shape', d: X`$x^2 + 1$: plus means tangent, with $a = 1$.`, m: [X`${pk(X`x = \tan\theta`)},\quad dx = \sec^{2}\theta\,d\theta`] },
          { t: 'Turn the power into sec', d: '', m: [X`(\tan^{2}\theta + 1)^{3/2} = (\sec^{2}\theta)^{3/2} = \sec^{3}\theta`] },
          { t: 'Plug everything in', d: '', m: [X`\int \frac{\sec^{2}\theta\,d\theta}{\sec^{3}\theta} = \int \cos\theta\,d\theta = \sin\theta`] },
          { t: 'Triangle back to x, then + C', d: X`$\tan\theta = \frac{x}{1}$: opposite $x$, adjacent 1, hypotenuse $\sqrt{x^2+1}$.`, m: [X`\sin\theta = \frac{x}{\sqrt{x^{2}+1}}`, X`= \frac{x}{\sqrt{x^{2} + 1}} + C`] },
        ],
        trap: X`The $\frac{3}{2}$ power is a root cubed. After the sub it is just $\sec^3\theta$, and things cancel.`,
        visual: { type: 'tri', opp: 'x', adj: '1', hyp: X`\sqrt{x^{2}+1}`, hi: ['opp', 'hyp'] },
        verify: { f: (x) => (x * x + 1) ** -1.5, F: (x) => x / Math.sqrt(x * x + 1), dom: [-2, 2] },
      },
    ],
  },

  /* ------------------------------------------------------------------ 7.4 (class notes) */
  pf: {
    big: 'Break one hard fraction into easy ones that each integrate in one line.',
    formula: X`\frac{P(x)}{Q(x)} = \frac{A}{x - a} + \frac{B}{x - b} + \cdots`,
    checklistName: 'The Master 5-Step Checklist',
    recipe: [
      { t: 'Degree check', d: X`$\deg(\text{top}) \ge \deg(\text{bottom})$? Improper: long division FIRST. Smaller? Go on.` },
      { t: 'Factor the bottom completely', d: X`Into linear factors $(ax + b)$ and irreducible quadratics ($b^2 - 4ac < 0$).` },
      { t: 'Set up the template', d: 'One piece per factor, and one per power if it repeats.' },
      { t: 'Solve for the constants', d: 'Multiply by the bottom (the basic equation). Heaviside cover-up: plug in the roots. Or match coefficients.' },
      { t: 'Integrate each piece', d: 'Logs, the power rule, arctan.' },
    ],
    visual: { type: 'templates' },
    scenarios: [
      {
        key: 'divide_first', name: 'Top degree ≥ bottom: divide first', spot: X`The top's highest power is at least the bottom's. (Class Example 1)`,
        pattern: X`\deg(\text{top}) \;${pk(X`\ge`)}\; \deg(\text{bottom})`, families: ['divide_lin', 'improper'],
        example: X`\int \frac{x^{3} + x}{x - 1}\,dx`,
        steps: [
          { t: 'Degree check', d: 'Top degree 3, bottom degree 1. Improper.', m: [X`\deg(\text{top}) = 3 \ge \deg(\text{bottom}) = 1 \;\Rightarrow\; \text{divide first}`] },
          { t: 'Write every power', d: 'Put a 0 in for any missing power so the columns line up.', m: [X`x^{3} + ${pk(X`0x^{2}`)} + x + ${pk(X`0`)} \;\div\; (x - 1)`] },
          { t: 'Long division', d: 'Divide leading terms, multiply back, subtract, bring down. Repeat.', m: [X`\text{Quotient} = x^{2} + x + 2, \qquad \text{Remainder} = 2`, X`\frac{x^{3} + x}{x - 1} = x^{2} + x + 2 + \frac{2}{x - 1}`] },
          { t: 'Integrate each piece, then + C', d: X`Power rule on the polynomial, a log for the remainder piece.`, m: [X`\int\left(x^{2} + x + 2 + \frac{2}{x - 1}\right)dx = \frac{x^{3}}{3} + \frac{x^{2}}{2} + 2x + 2\ln|x - 1| + C`] },
        ],
        trap: 'Skipping the degree check is the #1 partial-fraction trap. If the top is as big as the bottom, divide FIRST.',
        visual: { type: 'longdiv' },
        verify: { f: (x) => (x ** 3 + x) / (x - 1), F: (x) => x ** 3 / 3 + x * x / 2 + 2 * x + 2 * Math.log(Math.abs(x - 1)), dom: [1.5, 4] },
      },
      {
        key: 'distinct', name: 'Case 1: different linear factors', spot: X`The bottom factors into different $(x - r)$ pieces. (Class Example 2)`,
        pattern: X`\frac{\cdots}{${pk(X`(x-3)`)}${lv(X`(x+1)`)}} = \frac{${pk(X`A`)}}{${pk(X`x-3`)}} + \frac{${lv(X`B`)}}{${lv(X`x+1`)}}`, families: ['distinct2', 'distinct3'],
        example: X`\int \frac{5x - 3}{(x - 3)(x + 1)}\,dx`,
        steps: [
          { t: 'Degree check', d: 'Top degree 1, bottom degree 2. Proper.', m: [X`\deg(\text{top}) = 1 < 2 \;\Rightarrow\; \text{proper}`] },
          { t: 'Set up the template', d: 'One fraction per factor, a constant on top.', m: [X`\frac{5x - 3}{(x-3)(x+1)} = \frac{${pk(X`A`)}}{x - 3} + \frac{${lv(X`B`)}}{x + 1}`] },
          { t: 'Basic equation', d: 'Multiply both sides by the whole bottom.', m: [X`5x - 3 = ${pk(X`A`)}(x + 1) + ${lv(X`B`)}(x - 3)`] },
          { t: 'Heaviside: x = 3 gives A', g: 'Heaviside: plug in one root to get A', d: 'At x = 3 the B term is 0.', m: [X`5(3) - 3 = ${pk(X`A`)}(3 + 1) \;\Rightarrow\; 12 = 4${pk(X`A`)} \;\Rightarrow\; ${pk(X`A = 3`)}`] },
          { t: 'Heaviside: x = −1 gives B', g: 'Heaviside: the other root gives B', d: 'At x = −1 the A term is 0.', m: [X`5(-1) - 3 = ${lv(X`B`)}(-1 - 3) \;\Rightarrow\; -8 = -4${lv(X`B`)} \;\Rightarrow\; ${lv(X`B = 2`)}`] },
          { t: 'Integrate, then + C', d: X`$\int\frac{k}{x - r}dx = k\ln|x - r|$.`, m: [X`\int\left(\frac{3}{x - 3} + \frac{2}{x + 1}\right)dx = 3\ln|x - 3| + 2\ln|x + 1| + C`] },
        ],
        trap: X`A root at $x = 3$ means the factor $(x - 3)$. Plug in the ROOT. And keep the absolute value bars.`,
        visual: { type: 'coverup', num: '5x-3', f1: '(x-3)', f2: '(x+1)', aLine: X`x = 3:\quad A = \frac{5(3)-3}{(3)+1} = \frac{12}{4} = 3`, bLine: X`x = -1:\quad B = \frac{5(-1)-3}{(-1)-3} = \frac{-8}{-4} = 2` },
        verify: { f: (x) => (5 * x - 3) / ((x - 3) * (x + 1)), F: (x) => 3 * Math.log(Math.abs(x - 3)) + 2 * Math.log(Math.abs(x + 1)), dom: [3.5, 6] },
        see: ['system'],
      },
      {
        key: 'repeated', name: 'Case 2: a repeated linear factor', spot: X`A linear factor that is squared (or cubed), like $(x - 1)^2$. (Class Example 3)`,
        pattern: X`\frac{\cdots}{x${pk(X`(x-1)^{2}`)}} = \frac{A}{x} + \frac{B}{${pk(X`x-1`)}} + \frac{C}{${pk(X`(x-1)^{2}`)}}`, families: ['repeated'],
        example: X`\int \frac{x^{2} + 1}{x(x - 1)^{2}}\,dx`,
        steps: [
          { t: 'Set up the template', d: 'A squared factor gets a fraction for EACH power.', m: [X`\frac{x^{2} + 1}{x(x-1)^{2}} = \frac{A}{x} + \frac{B}{${pk(X`x - 1`)}} + \frac{C}{${pk(X`(x - 1)^{2}`)}}`] },
          { t: 'Basic equation', d: 'Multiply both sides by the whole bottom.', m: [X`x^{2} + 1 = A(x - 1)^{2} + Bx(x - 1) + Cx`] },
          { t: 'Heaviside: x = 0 and x = 1', g: 'Heaviside: plug in each root', d: 'Each root kills everything but one term.', m: [X`x = 0:\; 1 = A(-1)^{2} \;\Rightarrow\; A = 1`, X`x = 1:\; 2 = C(1) \;\Rightarrow\; C = 2`] },
          { t: 'Any other x for B', d: 'No root isolates B, so plug in an easy number like x = 2.', m: [X`x = 2:\; 5 = 1(1)^{2} + 2B(1) + 2(2) \;\Rightarrow\; 5 = 5 + 2B \;\Rightarrow\; B = 0`] },
          { t: 'Integrate, then + C', d: X`Power rule on the squared piece: $\int 2(x-1)^{-2}dx = -\frac{2}{x - 1}$.`, m: [X`\int\left(\frac{1}{x} + \frac{2}{(x-1)^{2}}\right)dx = \ln|x| - \frac{2}{x - 1} + C`] },
        ],
        trap: X`The squared piece is NOT a log. Power rule: $\frac{2}{(x-1)^2} \to -\frac{2}{x - 1}$.`,
        verify: { f: (x) => (x * x + 1) / (x * (x - 1) ** 2), F: (x) => Math.log(Math.abs(x)) - 2 / (x - 1), dom: [1.5, 4] },
        see: ['system'],
      },
      {
        key: 'irreducible', name: 'Case 3: a quadratic that won\'t factor', spot: X`A quadratic like $x^2 + 4$ that never hits 0 ($b^2 - 4ac < 0$). (Class Example 4)`,
        pattern: X`\frac{\cdots}{x${pk(X`(x^{2}+4)`)}} = \frac{A}{x} + \frac{${pk(X`Bx + C`)}}{${pk(X`x^{2}+4`)}}`, families: ['irreducible', 'split'],
        example: X`\int \frac{2x^{2} - x + 4}{x(x^{2} + 4)}\,dx`,
        steps: [
          { t: 'Set up the template', d: X`$x^2 + 4$ stays whole, and its top is linear: $Bx + C$.`, m: [X`\frac{2x^{2} - x + 4}{x(x^{2}+4)} = \frac{A}{x} + \frac{${pk(X`Bx + C`)}}{x^{2} + 4}`] },
          { t: 'Basic equation, expand, group', d: '', m: [X`2x^{2} - x + 4 = A(x^{2} + 4) + (Bx + C)x`, X`= (A + B)x^{2} + Cx + 4A`] },
          { t: 'Matching coefficients', d: 'Match each power of x on both sides.', m: [X`x^{0}:\; 4A = 4 \;\Rightarrow\; A = 1`, X`x^{1}:\; C = -1`, X`x^{2}:\; A + B = 2 \;\Rightarrow\; 1 + B = 2 \;\Rightarrow\; B = 1`] },
          { t: 'Split the quadratic piece', d: 'The x part is a u-sub (log). The number part is arctan.', m: [X`\frac{x - 1}{x^{2}+4} = \frac{${pk(X`x`)}}{x^{2}+4} - \frac{${lv(X`1`)}}{x^{2}+4}`] },
          { t: 'Integrate, then + C', d: X`$\int\frac{x}{x^2+4}dx = \frac{1}{2}\ln(x^2+4)$ and $\int\frac{dx}{x^2+4} = \frac{1}{2}\arctan\frac{x}{2}$.`, m: [X`= \ln|x| + ${pk(X`\frac{1}{2}\ln(x^{2} + 4)`)} - ${lv(X`\frac{1}{2}\arctan\frac{x}{2}`)} + C`] },
        ],
        trap: X`$x^2 + 4$ does NOT factor (that is $x^2 - 4$). And the top over a quadratic is $Bx + C$, not just $B$.`,
        verify: { f: (x) => (2 * x * x - x + 4) / (x * (x * x + 4)), F: (x) => Math.log(Math.abs(x)) + 0.5 * Math.log(x * x + 4) - 0.5 * Math.atan(x / 2), dom: [0.5, 3] },
        see: ['system'],
      },
      {
        key: 'rep_quad', name: 'Case 4: that quadratic, squared', spot: X`An irreducible quadratic that repeats, like $(x^2 + 1)^2$. (Class Example 5)`,
        pattern: X`\frac{Bx + C}{x^{2}+1} + \frac{${pk(X`Dx + E`)}}{${pk(X`(x^{2}+1)^{2}`)}}`, families: ['rep_quad'],
        example: X`\int \frac{x^{4} + 1}{x(x^{2} + 1)^{2}}\,dx`,
        steps: [
          { t: 'Set up the template', d: 'One fraction for each power of the quadratic, each with a linear top.', m: [X`\frac{x^{4} + 1}{x(x^{2}+1)^{2}} = \frac{A}{x} + \frac{Bx + C}{x^{2} + 1} + \frac{${pk(X`Dx + E`)}}{${pk(X`(x^{2} + 1)^{2}`)}}`] },
          { t: 'Basic equation', d: 'Multiply both sides by the whole bottom.', m: [X`x^{4} + 1 = A(x^{2}+1)^{2} + (Bx + C)x(x^{2}+1) + (Dx + E)x`] },
          { t: 'Heaviside: x = 0 gives A', g: 'Heaviside: plug in the linear root', d: 'Every term with an x in front vanishes.', m: [X`1 = A(0^{2} + 1)^{2} \;\Rightarrow\; A = 1`] },
          { t: 'Match coefficients for the rest', d: 'Expand, group by powers, match.', m: [X`x^{4}:\; 1 = A + B \Rightarrow B = 0 \qquad x^{3}:\; 0 = C`, X`x^{2}:\; 0 = 2A + B + D \Rightarrow D = -2 \qquad x^{1}:\; 0 = C + E \Rightarrow E = 0`] },
          { t: 'Integrate, then + C', d: X`u-sub on the squared piece: $u = x^2 + 1$, so $\int\frac{-2x}{u^2}dx = \frac{1}{u}$.`, m: [X`\int\left(\frac{1}{x} - \frac{2x}{(x^{2}+1)^{2}}\right)dx = \ln|x| + ${pk(X`\frac{1}{x^{2} + 1}`)} + C`] },
        ],
        trap: X`The squared piece is a u-sub with $u = x^2 + 1$, NOT a log.`,
        verify: { f: (x) => (x ** 4 + 1) / (x * (x * x + 1) ** 2), F: (x) => Math.log(Math.abs(x)) + 1 / (x * x + 1), dom: [0.5, 3] },
        see: ['system'],
      },
      {
        key: 'system', skill: true, name: 'Solve the system (match coefficients)', spot: X`No root gives you the constants, or the problem says "match coefficients." You get one equation per power of $x$.`,
        pattern: X`\left\{\begin{aligned} ${pk(X`A`)} + ${lv(X`B`)} &= 5 \\ ${pk(X`A`)} - 3${lv(X`B`)} &= -3 \end{aligned}\right.`, families: ['sys_elim', 'sys_chain'],
        example: X`\int \frac{5x - 3}{(x - 3)(x + 1)}\,dx`,
        steps: [
          { t: 'Basic equation', d: 'Template, then multiply both sides by the whole bottom. (Same start as Class Example 2.)', m: [X`\frac{5x - 3}{(x-3)(x+1)} = \frac{${pk(X`A`)}}{x - 3} + \frac{${lv(X`B`)}}{x + 1}`, X`5x - 3 = ${pk(X`A`)}(x + 1) + ${lv(X`B`)}(x - 3)`] },
          { t: 'Expand and group by powers of x', d: X`Multiply out, then put the $x$ terms together and the plain numbers together.`, m: [X`= ${pk(X`A`)}x + ${pk(X`A`)} + ${lv(X`B`)}x - 3${lv(X`B`)}`, X`= (${pk(X`A`)} + ${lv(X`B`)})x + (${pk(X`A`)} - 3${lv(X`B`)})`] },
          { t: 'Match coefficients: one equation per power', d: X`The $x$ numbers match, and the plain numbers match.`, m: [X`x:\; ${pk(X`A`)} + ${lv(X`B`)} = 5 \qquad \text{numbers:}\; ${pk(X`A`)} - 3${lv(X`B`)} = -3`] },
          { t: 'Eliminate a letter', g: 'Add or subtract so one letter cancels', d: X`Both equations have one $A$, so subtract the second from the first. Subtract EVERY term, numbers too.`, m: [X`(${pk(X`A`)} + ${lv(X`B`)}) - (${pk(X`A`)} - 3${lv(X`B`)}) = 5 - (-3)`, X`\cancel{${pk(X`A`)}} + ${lv(X`B`)} - \cancel{${pk(X`A`)}} + 3${lv(X`B`)} = 8 \;\Rightarrow\; 4${lv(X`B`)} = 8 \;\Rightarrow\; ${lv(X`B = 2`)}`] },
          { t: 'Plug it back in', g: 'Plug the value back in for the other letter', d: 'Put B into the easier equation, fully plugged in.', m: [X`${pk(X`A`)} + (2) = 5 \;\Rightarrow\; ${pk(X`A = 3`)}`] },
          { t: 'Check, then integrate + C', d: 'Plug both values into the equation you did not use. Then integrate like Case 1.', m: [X`\text{Check: } (3) - 3(2) = -3 \;\checkmark`, X`\int\left(\frac{3}{x - 3} + \frac{2}{x + 1}\right)dx = 3\ln|x - 3| + 2\ln|x + 1| + C`] },
        ],
        twin: { title: 'Or by substitution', tex: X`\begin{aligned} A &= 5 - B \\ (5 - B) - 3B &= -3 \\ 5 - 4B &= -3 \\ -4B &= -8 \;\Rightarrow\; B = 2 \\ A &= 5 - (2) = 3 \end{aligned}`, note: 'Solve one equation for a letter, plug it into the other. Same answer. Got an equation with only ONE letter (like $4A = 4$)? Solve that first, then plug down the chain.' },
        trap: X`When you subtract an equation, flip the sign of EVERY term: $-(A - 3B) = -A + 3B$, and $5 - (-3) = 8$.`,
        visual: { type: 'moves' },
        verify: { f: (x) => (5 * x - 3) / ((x - 3) * (x + 1)), F: (x) => 3 * Math.log(Math.abs(x - 3)) + 2 * Math.log(Math.abs(x + 1)), dom: [3.5, 6] },
      },
    ],
  },

  /* ------------------------------------------------------------------ 7.8 (class notes) */
  imp: {
    big: X`An improper integral is a LIMIT. Swap every trouble spot for a letter, integrate, then let the letter go.`,
    formula: X`\int_{a}^{\infty} f\,dx = \lim_{b\to\infty}\int_{a}^{b} f\,dx`,
    checklistName: 'The improper-integral play',
    recipe: [
      { t: 'Zero-check scan', d: X`Is a limit $\pm\infty$? Does anything in $[a, b]$ make the bottom 0 (or break $\ln$)?` },
      { t: 'Split if needed', d: 'One trouble spot per piece. Both ends infinite: split at 0. Asymptote inside: split there.' },
      { t: 'Rewrite with limits', d: X`Swap each trouble spot for a letter ($b$, $a$, or $t$). Approach from INSIDE the interval.` },
      { t: 'Integrate', d: 'Find the antiderivative like normal.' },
      { t: 'Plug in, take the limit', d: 'Top minus bottom, fully plugged in, then the limit.' },
      { t: 'Conclude', d: X`A finite number: converges to it. $\pm\infty$ or no limit: diverges. If ANY piece diverges, the whole thing diverges.` },
    ],
    visual: { type: 'twoKinds' },
    scenarios: [
      {
        key: 'upper_inf', name: 'Top limit is ∞', spot: X`$\int_{a}^{\infty}$. (Type 1, class Example 1)`,
        pattern: X`\int_{a}^{${pk(X`\infty`)}} f(x)\,dx = \lim_{${pk(X`b`)}\to\infty}\int_{a}^{${pk(X`b`)}} f(x)\,dx`, families: ['p_inf', 'exp_inf', 'arctan_inf', 'shifted_inf', 'ln_inf', 'ibp_inf', 'pf_inf'],
        example: X`\int_{1}^{\infty} \frac{1}{x^{2}}\,dx`,
        steps: [
          { t: 'Spot it', d: X`The top limit is $\infty$, and $\frac{1}{x^2}$ is fine on $[1, \infty)$.`, m: [X`\text{top limit} = \infty \;\Rightarrow\; \text{Type 1}`] },
          { t: 'Swap ∞ for b', d: X`You cannot plug in $\infty$. Use $b$ and a limit.`, m: [X`\int_{1}^{\infty}\frac{dx}{x^{2}} = \lim_{${pk(X`b`)}\to\infty}\int_{1}^{${pk(X`b`)}} x^{-2}\,dx`] },
          { t: 'Integrate', d: X`Power rule: add 1 to the power, divide by the new power.`, m: [X`\int x^{-2}\,dx = \frac{x^{-1}}{-1} = -\frac{1}{x}`] },
          { t: 'Plug in b and 1', g: 'Plug in b and the bottom limit', d: 'Top minus bottom, fully plugged in.', m: [X`\left[-\frac{1}{x}\right]_{1}^{${pk(X`b`)}} = \left(-\frac{1}{${pk(X`b`)}}\right) - \left(-\frac{1}{1}\right) = -\frac{1}{${pk(X`b`)}} + 1`] },
          { t: 'Take the limit, decide', d: X`$\frac{1}{b} \to 0$ as $b \to \infty$.`, m: [X`\lim_{b\to\infty}\left(-\frac{1}{b} + 1\right) = 0 + 1 = 1 \quad ${mt(X`\text{converges to } 1`)}`] },
        ],
        twin: { tex: X`\int_{1}^{\infty}\frac{1}{x}\,dx = \lim_{b\to\infty}\left(\ln b - \ln 1\right) = \infty`, note: 'diverges: ln b never levels off' },
        trap: X`Never plug $\infty$ into $F$. Swap it for $b$ and take a limit.`,
        visual: { type: 'tail' },
        verify: { F: (x) => -1 / x, lo: 1, hi: 1e12, value: 1 },
      },
      {
        key: 'lower_inf', name: 'Bottom limit is −∞', spot: X`$\int_{-\infty}^{b}$. (Type 1)`,
        pattern: X`\int_{${pk(X`-\infty`)}}^{b} f(x)\,dx = \lim_{${pk(X`a`)}\to-\infty}\int_{${pk(X`a`)}}^{b} f(x)\,dx`, families: ['exp_neg_inf'],
        example: X`\int_{-\infty}^{0} e^{x}\,dx`,
        steps: [
          { t: 'Spot it', d: '', m: [X`\text{bottom limit} = -\infty \;\Rightarrow\; \text{Type 1}`] },
          { t: 'Swap −∞ for a', d: '', m: [X`\int_{-\infty}^{0} e^{x}\,dx = \lim_{${pk(X`a`)}\to-\infty}\int_{${pk(X`a`)}}^{0} e^{x}\,dx`] },
          { t: 'Integrate', d: '', m: [X`\int e^{x}\,dx = e^{x}`] },
          { t: 'Plug in 0 and a', g: 'Plug in the top limit and a', d: '', m: [X`\left[e^{x}\right]_{${pk(X`a`)}}^{0} = e^{0} - e^{${pk(X`a`)}} = 1 - e^{${pk(X`a`)}}`] },
          { t: 'Take the limit, decide', d: X`$e$ to a huge NEGATIVE power is tiny.`, m: [X`\lim_{a\to-\infty}\left(1 - e^{a}\right) = 1 - 0 = 1 \quad ${mt(X`\text{converges to } 1`)}`] },
        ],
        trap: X`$a \to -\infty$, so $e^{a} \to 0$, not $\infty$.`,
        verify: { F: (x) => Math.exp(x), lo: -60, hi: 0, value: 1 },
      },
      {
        key: 'both_inf', name: 'Both limits infinite: split at 0', spot: X`$\int_{-\infty}^{\infty}$. Two trouble spots, so two pieces. (Type 1)`,
        pattern: X`\int_{-\infty}^{\infty} f = \int_{-\infty}^{${pk(X`0`)}} f + \int_{${pk(X`0`)}}^{\infty} f`, families: ['both_inf'],
        example: X`\int_{-\infty}^{\infty} \frac{dx}{1 + x^{2}}`,
        steps: [
          { t: 'Split at 0', d: 'One limit per trouble spot. Any split point works; 0 is easiest.', m: [X`\int_{-\infty}^{\infty}\frac{dx}{1+x^{2}} = \int_{-\infty}^{${pk(X`0`)}}\frac{dx}{1+x^{2}} + \int_{${pk(X`0`)}}^{\infty}\frac{dx}{1+x^{2}}`] },
          { t: 'Integrate', d: '', m: [X`\int\frac{dx}{1+x^{2}} = \arctan x`] },
          { t: 'Left half', d: X`$\arctan$ levels off at $-\frac{\pi}{2}$ on the far left.`, m: [X`\lim_{a\to-\infty}\left(\arctan 0 - \arctan a\right) = 0 - \left(-\frac{\pi}{2}\right) = \frac{\pi}{2}`] },
          { t: 'Right half', d: '', m: [X`\lim_{b\to\infty}\left(\arctan b - \arctan 0\right) = \frac{\pi}{2} - 0 = \frac{\pi}{2}`] },
          { t: 'Both converge: add', g: 'Both must converge: then add', d: 'BOTH halves must converge. Then add them.', m: [X`\frac{\pi}{2} + \frac{\pi}{2} = \pi \quad ${mt(X`\text{converges to } \pi`)}`] },
        ],
        trap: X`$\int_{-\infty}^{\infty} x\,dx$ is NOT 0. Each half diverges, so it diverges. Never use one shared limit $\int_{-t}^{t}$.`,
        verify: { F: Math.atan, lo: -1e12, hi: 1e12, value: Math.PI },
      },
      {
        key: 'end_asym', name: 'Blows up at an endpoint', spot: X`A vertical asymptote at $a$ or $b$, like $\frac{1}{\sqrt{x}}$ at $x = 0$. (Type 2)`,
        pattern: X`\int_{${pk(X`a`)}}^{b} f\,dx = \lim_{t\to ${pk(X`a`)}^{+}}\int_{t}^{b} f\,dx`, families: ['p_zero', 'endpoint_root'],
        example: X`\int_{0}^{1} \frac{1}{\sqrt{x}}\,dx`,
        steps: [
          { t: 'Spot it', d: X`$x = 0$ makes $\sqrt{x} = 0$ on the bottom: an asymptote at the left end.`, m: [X`\frac{1}{\sqrt{x}} \to \infty \text{ as } x \to 0^{+}`] },
          { t: 'Swap the bad end for t', d: 'Come at it from INSIDE the interval: from the right.', m: [X`\int_{0}^{1}\frac{dx}{\sqrt{x}} = \lim_{${pk(X`t`)}\to 0^{+}}\int_{${pk(X`t`)}}^{1} x^{-1/2}\,dx`] },
          { t: 'Integrate', d: '', m: [X`\int x^{-1/2}\,dx = \frac{x^{1/2}}{1/2} = 2\sqrt{x}`] },
          { t: 'Plug in 1 and t', g: 'Plug in the good end and t', d: '', m: [X`\left[2\sqrt{x}\right]_{${pk(X`t`)}}^{1} = 2\sqrt{1} - 2\sqrt{${pk(X`t`)}} = 2 - 2\sqrt{${pk(X`t`)}}`] },
          { t: 'Take the limit, decide', d: '', m: [X`\lim_{t\to 0^{+}}\left(2 - 2\sqrt{t}\right) = 2 - 0 = 2 \quad ${mt(X`\text{converges to } 2`)}`] },
        ],
        twin: { tex: X`\int_{0}^{1}\frac{1}{x}\,dx = \lim_{t\to 0^{+}}\left(\ln 1 - \ln t\right) = \infty`, note: 'diverges: −ln t blows up' },
        trap: X`Approach from INSIDE: a bad left end uses $t \to a^{+}$, a bad right end uses $t \to b^{-}$.`,
        visual: { type: 'spike' },
        verify: { F: (x) => 2 * Math.sqrt(x), lo: 1e-14, hi: 1, value: 2 },
      },
      {
        key: 'inside_asym', name: 'Blows up inside [a, b]: split there', spot: X`The bottom hits 0 somewhere BETWEEN the limits. (Type 2, the class trap)`,
        pattern: X`\int_{a}^{b} f = \int_{a}^{${pk(X`c`)}} f + \int_{${pk(X`c`)}}^{b} f`, families: ['interior'],
        example: X`\int_{-1}^{2} \frac{1}{x^{2}}\,dx`,
        steps: [
          { t: 'Zero-check scan', d: X`$x = 0$ makes $x^2 = 0$, and 0 is inside $[-1, 2]$.`, m: [X`x = ${pk(X`0`)} \in [-1, 2] \;\Rightarrow\; \text{split at } 0`] },
          { t: 'Do NOT integrate straight across', d: 'Blind integration gives a negative area for a positive function. Impossible.', m: [X`\left[-\frac{1}{x}\right]_{-1}^{2} = -\frac{1}{2} - 1 = ${'\\htmlClass{hbad}{-\\frac{3}{2}}'} \quad \text{(wrong!)}`] },
          { t: 'Split at 0', g: 'Split at the asymptote', d: 'Each piece gets its own one-sided limit.', m: [X`\int_{-1}^{2}\frac{dx}{x^{2}} = \lim_{t\to ${pk(X`0`)}^{-}}\int_{-1}^{t}\frac{dx}{x^{2}} + \lim_{s\to ${pk(X`0`)}^{+}}\int_{s}^{2}\frac{dx}{x^{2}}`] },
          { t: 'Check the left piece', g: 'Check each piece', d: X`$t$ is a tiny NEGATIVE number, so $-\frac{1}{t}$ is huge and positive.`, m: [X`\lim_{t\to 0^{-}}\left[-\frac{1}{x}\right]_{-1}^{t} = \lim_{t\to 0^{-}}\left(-\frac{1}{t} - 1\right) = +\infty`] },
          { t: 'One piece diverges: done', g: 'Any piece diverges? The whole thing diverges', d: 'You do not even need the right piece.', m: [X`\Rightarrow\; \int_{-1}^{2}\frac{dx}{x^{2}} \;\; ${'\\htmlClass{hbad}{\\text{diverges}}'}`] },
        ],
        trap: 'Before ANY definite integral, scan [a, b] for x-values that make the bottom 0.',
        visual: { type: 'splitTrap' },
        verify: { F: (x) => -1 / x, lo: -1, hi: -1e-12, diverges: true },
      },
      {
        key: 'p_test', name: 'p-test shortcut: 1/xᵖ', spot: X`$\int\frac{1}{x^{p}}$ out to $\infty$ or near 0. Decide in one line.`,
        pattern: X`\int_{1}^{\infty}\frac{dx}{x^{${pk(X`p`)}}} \qquad \int_{0}^{1}\frac{dx}{x^{${pk(X`p`)}}}`, families: ['p_inf', 'p_zero'],
        example: X`\int_{1}^{\infty} \frac{1}{x\sqrt{x}}\,dx`,
        steps: [
          { t: 'Write it as 1/xᵖ', d: '', m: [X`\frac{1}{x\sqrt{x}} = \frac{1}{x^{3/2}} \;\Rightarrow\; ${pk(X`p = \tfrac{3}{2}`)}`] },
          { t: 'Which kind of trouble?', d: X`Out to $\infty$ or near 0? The rule FLIPS.`, m: [X`\int_{1}^{\infty}: \text{ converges if } p > 1 \qquad \int_{0}^{1}: \text{ converges if } p < 1`] },
          { t: 'Decide', d: '', m: [X`p = \tfrac{3}{2} > 1 \;\Rightarrow\; ${mt(X`\text{converges}`)}`] },
          { t: 'Value, if they ask', d: X`Out to $\infty$ from 1, the value is $\frac{1}{p - 1}$.`, m: [X`\frac{1}{p - 1} = \frac{1}{\tfrac{3}{2} - 1} = \frac{1}{\tfrac{1}{2}} = 2`] },
        ],
        trap: X`$p = 1$ diverges BOTH ways ($\ln$ never levels off).`,
        visual: { type: 'ptest' },
        verify: { F: (x) => -2 / Math.sqrt(x), lo: 1, hi: 1e14, value: 2 },
      },
    ],
  },
};

/* ---------- which scenario does a generated problem belong to? ---------- */
M.guideScenario = function (unit, p) {
  const g = M.GUIDE[unit]; if (!g || !p) return null;
  if (unit === 'tsub' && (p.family === 'x2_root' || p.family === 'pow32')) {
    if (p.family === 'pow32') return g.scenarios.find((s) => s.key === 'pow32');
    return g.scenarios.find((s) => s.key === `${p.form}_form`) || null;
  }
  if (unit === 'imp' && p.improper) {
    const t = p.improper.type;
    if (t === 'interior') return g.scenarios.find((s) => s.key === 'inside_asym');
    if (t === 'both') return g.scenarios.find((s) => s.key === 'both_inf');
    if (t === 'lower') return g.scenarios.find((s) => s.key === 'lower_inf');
    if (t === 'left' || t === 'right') return g.scenarios.find((s) => s.key === 'end_asym');
    return g.scenarios.find((s) => s.key === 'upper_inf');
  }
  return g.scenarios.find((s) => s.families.includes(p.family)) || null;
};
/** a fresh practice problem for one scenario ("Try one"): keeps drawing from its families until one lands in it */
M.guideTry = function (unit, key, level, rng, prefer) {
  const g = M.GUIDE[unit]; const s = g && g.scenarios.find((x) => x.key === key); if (!s) return null;
  rng = rng || M.rng();
  const fits = (p) => { const b = M.guideScenario(unit, p); return !!b && (b.key === key || (key === 'p_test' && /^p_/.test(p.family))); };
  // "same type again" keeps the family when it can, but never leaves the scenario
  const pools = prefer && s.families.includes(prefer) ? [[prefer], s.families] : [s.families];
  let last = null;
  for (const fams of pools) {
    for (let t = 0; t < 40; t++) {
      const p = M.generate(unit, level, rng, rng.pick(fams));
      if (fits(p)) return p;
      last = p;
    }
  }
  return last;
};

/* ---------- "Which method?": one yes/no question at a time ---------- */
M.WHICH = {
  start: { short: "Plain u-sub", q: 'Can a plain u-sub do it?', sub: 'Is the derivative of an inside piece already sitting outside (up to a number)?', ex: [X`\int x\,e^{x^{2}}\,dx`, X`\int\frac{x}{x^{2}+4}\,dx`, X`\int\frac{\ln x}{x}\,dx`], yes: 'L:usub', no: 'imp' },
  imp: { short: "Improper", q: 'Is a limit ∞ or −∞, or does it blow up somewhere in [a, b]?', sub: 'Scan the limits, then scan the interval for zeros of the bottom.', ex: [X`\int_{1}^{\infty}\frac{dx}{x^{2}}`, X`\int_{0}^{1}\frac{dx}{\sqrt{x}}`, X`\int_{-1}^{2}\frac{dx}{x^{2}}`], yes: 'impType', no: 'rat' },
  impType: { short: "Trouble", q: 'Where is the trouble?', choices: [
    { label: 'The top limit is ∞', to: 'S:imp/upper_inf' },
    { label: 'The bottom limit is −∞', to: 'S:imp/lower_inf' },
    { label: 'Both limits are infinite', to: 'S:imp/both_inf' },
    { label: 'It blows up at an endpoint', to: 'S:imp/end_asym' },
    { label: 'It blows up inside [a, b]', to: 'S:imp/inside_asym' },
    { label: 'It is just 1/xᵖ (p-test)', to: 'S:imp/p_test' },
  ] },
  rat: { short: "Polynomial fraction", q: 'Is it a fraction of two polynomials?', sub: 'Only powers of x on top and bottom. No roots, no trig.', ex: [X`\frac{5x-3}{x^{2}-2x-3}`, X`\frac{x^{3}+x}{x-1}`], yes: 'ratDeg', no: 'root' },
  ratDeg: { short: "Top ≥ bottom", q: 'Is the top degree ≥ the bottom degree?', sub: 'Compare the highest powers.', yes: 'S:pf/divide_first', no: 'ratFac' },
  ratFac: { short: "Bottom", q: 'Factor the bottom. What do you see?', choices: [
    { label: 'Different linear factors', tex: X`(x-3)(x+1)`, to: 'S:pf/distinct' },
    { label: 'A repeated linear factor', tex: X`x(x-1)^{2}`, to: 'S:pf/repeated' },
    { label: 'A quadratic that won\'t factor', tex: X`x(x^{2}+4)`, to: 'S:pf/irreducible' },
    { label: 'That quadratic, squared', tex: X`x(x^{2}+1)^{2}`, to: 'S:pf/rep_quad' },
  ] },
  root: { short: "Root shape", q: 'Is there a root like √(a² − x²), √(a² + x²), or √(x² − a²)?', sub: 'Or the same thing to the 3/2, or a quadratic with an x term.', ex: [X`\sqrt{9-x^{2}}`, X`\sqrt{x^{2}+4}`, X`(x^{2}+1)^{3/2}`], yes: 'rootShape', no: 'trigp' },
  rootShape: { short: "Shape", q: 'Which shape?', choices: [
    { tex: X`\sqrt{a^{2}-x^{2}}`, label: 'number minus x²', to: 'S:tsub/sin_form' },
    { tex: X`\sqrt{a^{2}+x^{2}}`, label: 'x² plus a number', to: 'S:tsub/tan_form' },
    { tex: X`\sqrt{x^{2}-a^{2}}`, label: 'x² minus a number', to: 'S:tsub/sec_form' },
    { tex: X`(a^{2}\pm x^{2})^{3/2}`, label: 'a 3/2 power', to: 'S:tsub/pow32' },
    { tex: X`x^{2}+bx+c`, label: 'has an x term', to: 'S:tsub/complete_sq' },
  ] },
  trigp: { short: "Trig powers", q: 'Is it powers of trig functions?', sub: 'sin and cos, or tan and sec.', ex: [X`\sin^{3}x\cos^{2}x`, X`\tan^{2}x\sec^{4}x`, X`\sin 4x\cos 5x`], yes: 'trigKind', no: 'parts' },
  trigKind: { short: "Kind", q: 'Which one?', choices: [
    { label: 'sin power is odd', tex: X`\sin^{3}x\cos^{2}x`, to: 'S:trig/sin_odd' },
    { label: 'cos power is odd', tex: X`\sin^{2}x\cos^{3}x`, to: 'S:trig/cos_odd' },
    { label: 'Both powers even', tex: X`\sin^{2}x`, to: 'S:trig/even' },
    { label: 'sec power is even', tex: X`\tan^{2}x\sec^{4}x`, to: 'S:trig/sec_even' },
    { label: 'tan power is odd', tex: X`\tan^{3}x\sec^{3}x`, to: 'S:trig/tan_odd' },
    { label: 'Different angles', tex: X`\sin 4x\cos 5x`, to: 'S:trig/diff_angles' },
    { label: 'One trig function alone', tex: X`\tan^{2}x`, to: 'S:trig/special' },
  ] },
  parts: { short: "Product or log", q: 'Is it two different kinds multiplied, or a lonely ln / inverse trig?', sub: 'Like x times eˣ, or ln x by itself.', ex: [X`x\,e^{2x}`, X`x^{2}\sin x`, X`e^{x}\sin x`, X`\ln x`], yes: 'partsKind', no: 'L:algebra' },
  partsKind: { short: "Kind", q: 'Which one?', choices: [
    { label: 'x times eˣ, sin, or cos', tex: X`x\,e^{2x}`, to: 'S:ibp/poly_exp_trig' },
    { label: 'x² or x³ times eˣ, sin, or cos', tex: X`x^{2}e^{x}`, to: 'S:ibp/tabular' },
    { label: 'ln x or inverse trig', tex: X`x\ln x`, to: 'S:ibp/log_inv' },
    { label: 'eˣ times sin or cos', tex: X`e^{x}\sin x`, to: 'S:ibp/loop' },
    { label: 'Same, but with limits', tex: X`\int_{0}^{1} x e^{x}dx`, to: 'S:ibp/definite_ibp' },
  ] },
};
M.WHICH_LEAVES = {
  usub: { title: 'u-sub', text: X`Let $u$ be the inside piece, find $du$, and swap. (Calc 1, but check it FIRST every time: it is the fastest tool.)` },
  algebra: { title: 'Try algebra first', text: 'Expand it, split the fraction into pieces, or use an identity. Then run the questions again. Still stuck? Ask Claude.' },
};
})(typeof globalThis !== 'undefined' ? globalThis : this);
