/* ==========================================================================
   Shared helpers for problem generators
   ========================================================================== */
(function (G) {
'use strict';
const M = G.M;
const Q = M.Q;
M.GEN = M.GEN || {};

// highlight wrappers (KaTeX \htmlClass → themed colors)
M.hl = {
  u: (s) => `\\htmlClass{hu}{${s}}`,
  v: (s) => `\\htmlClass{hv}{${s}}`,
  d: (s) => `\\htmlClass{hd}{${s}}`,
  k: (s) => `\\htmlClass{hk}{${s}}`,
  bad: (s) => `\\htmlClass{hbad}{${s}}`,
};

/** Negate / scale a sum (for generic distractors) */
M.sumMap = function (s, fn) { return M.sum(s.terms.map((t) => M.term(fn(t.c, t), t.pieces, t.style))); };
M.sumNeg = (s) => M.sumMap(s, (c) => Q.neg(c));
M.sumScale = (s, k) => M.sumMap(s, (c) => Q.mul(c, Q(k)));
M.sumDropLast = (s) => M.sum(s.terms.slice(0, -1));
M.sumAdd = (s, extra) => M.sum(s.terms.concat(extra));
M.mistake = (s, tag, msg, step) => ({ tex: s.tex, f: s.f, tag, msg, step });

/** Step builders */
M.st = {
  // two choices that read the same would make one of them a trick: keep one (the right one, if either is)
  choice: (prompt, options, points = 1) => ({ kind: 'choice', prompt, options: options.filter((o, i) => { const k = o.tex || o.text; return !options.some((q, j) => j !== i && (q.tex || q.text) === k && (q.ok && !o.ok || (!!q.ok === !!o.ok && j < i))); }), points }),
  expr: (promptTex, o) => ({ kind: 'expr', promptTex, points: 2, vars: ['x'], exact: false, ...o }),
  num: (promptTex, value, o = {}) => ({ kind: 'num', promptTex, expect: value, points: 2, ...o }),
  final: (points = 3) => ({ kind: 'final', points }),
};

/** Finalize a problem: dedupe mistakes, drop any equivalent to the answer. */
M.finish = function (p) {
  p.id = p.id || `${p.unit}-${p.family}-${Math.random().toString(36).slice(2, 8)}`;
  p.speech = p.speech || ('Find ' + M.speak(p.tex));
  if (p.improper) { // value answers (a number or "diverges"): mistakes are values, not functions
    const total = (p.steps || []).reduce((s, st) => s + (st.check ? st.check.points || 0 : 0), 0);
    p.outOf = total || 10;
    return p;
  }
  const pts = M.points(p.domain, 9, 11);
  const seen = [];
  const out = [];
  for (const m of p.mistakes || []) {
    if (!m || !m.f) continue;
    if (M.equivConst(m.f, p.answer.f, pts).ok) continue;
    const dup = seen.find((s) => M.equivConst(m.f, s.f, pts).ok);
    if (dup) { if (m.msg && dup.msg && !dup.msg.includes(m.msg)) dup.alt = (dup.alt || []).concat(m.msg); continue; }
    seen.push(m); out.push(m);
  }
  p.mistakes = out;
  const total = (p.steps || []).reduce((s, st) => s + (st.check ? st.check.points || 0 : 0), 0);
  p.outOf = total || 12;
  return p;
};

/** Multiple-choice options for a problem: correct + 3 distractors. */
M.makeMC = function (p, rng) {
  rng = rng || M.rng();
  if (p.improper) return M.makeMCImp(p, rng);
  const pts = M.points(p.domain, 9, 13);
  const opts = [{ tex: p.answer.tex + ' + C', correct: true }];
  const pool = rng.shuffle((p.mistakes || []).filter((m) => m.tex));
  // prefer diverse tags
  const byTag = new Set();
  const take = (m) => {
    if (opts.length >= 4) return;
    if (opts.some((o) => o.f && M.equivConst(o.f, m.f, pts).ok)) return;
    if (M.equivConst(m.f, p.answer.f, pts).ok) return;
    opts.push({ tex: m.tex + ' + C', correct: false, msg: m.msg, tag: m.tag, f: m.f });
    byTag.add(m.tag);
  };
  for (const m of pool) if (!byTag.has(m.tag)) take(m);
  for (const m of pool) take(m);
  // generic fallbacks
  const gens = [
    () => M.mistake(M.sumNeg(p.answer), 'sign', 'Every sign is flipped.'),
    () => M.mistake(M.sumScale(p.answer, 2), 'kfactor', 'Twice too big — a factor slipped.'),
    () => M.mistake(M.sumScale(p.answer, Q(1, 2)), 'kfactor', 'Half too small — a factor slipped.'),
    () => (p.answer.terms.length > 1 ? M.mistake(M.sumDropLast(p.answer), 'rounds', 'A whole term is missing.') : null),
  ];
  for (const g of gens) { if (opts.length >= 4) break; const m = g(); if (m) take(m); }
  return rng.shuffle(opts);
};

/** Registry of units */
M.UNITS = [
  { key: 'ibp', name: 'Integration by Parts', short: 'By Parts', sec: '7.1', glyph: '\\int u\\,dv', color: 'pink', sample: '\\int x\\,e^{x}\\,dx' },
  { key: 'trig', name: 'Trigonometric Integrals', short: 'Trig Integrals', sec: '7.2', glyph: '\\sin^{m}\\cos^{n}', color: 'lav', sample: '\\int \\sin^{3}x\\,dx' },
  { key: 'tsub', name: 'Trigonometric Substitution', short: 'Trig Sub', sec: '7.3', glyph: 'x = a\\sin\\theta', color: 'mint', sample: '\\int \\sqrt{9-x^{2}}\\,dx' },
  { key: 'pf', name: 'Partial Fractions', short: 'Partial Fractions', sec: '7.4', glyph: '\\tfrac{A}{x-a}+\\tfrac{B}{x-b}', color: 'butter', sample: '\\int \\frac{dx}{x^{2}-1}' },
  { key: 'imp', name: 'Improper Integrals', short: 'Improper', sec: '7.8', glyph: '\\lim_{b\\to\\infty}', color: 'sky', sample: '\\int_{1}^{\\infty} \\frac{dx}{x^{2}}' },
];
M.unit = (key) => M.UNITS.find((u) => u.key === key);

/** Generate a problem for a unit at a level (1–3) */
M.generate = function (unitKey, level, rng, family) {
  rng = rng || M.rng();
  const g = M.GEN[unitKey];
  for (let tries = 0; tries < 30; tries++) {
    try {
      const p = g(level, rng, family);
      if (p) { p.unit = unitKey; p.level = p.level || level; p.method = p.method || unitKey; return M.finish(p); }
    } catch (e) { if (tries > 25) throw e; }
  }
  throw new Error('generator failed: ' + unitKey);
};

/** Binomial coefficient */
M.binom = function (n, k) { let r = 1; for (let i = 1; i <= k; i++) r = (r * (n - i + 1)) / i; return Math.round(r); };

})(typeof globalThis !== 'undefined' ? globalThis : this);
