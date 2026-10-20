// Checks the study guide: every worked example is right, every formula renders,
// every problem the app can generate maps to a scenario, and the Which-method tree is complete.
const katex = require('katex');
for (const n of ['engine', 'gen_common', 'gen_ibp', 'gen_trig', 'gen_tsub', 'gen_pf', 'gen_imp', 'lessons', 'guide']) require(__dirname + '/../src/' + n + '.js');
const M = globalThis.M;
let fails = 0, checks = 0;
const fail = (k, m) => { fails++; console.log('FAIL', k, m); };
const texOK = (tex, where) => { checks++; try { katex.renderToString(tex, { throwOnError: true, displayMode: true, trust: (c) => c.command === '\\htmlClass', strict: false }); } catch (e) { fail('katex ' + where, tex + ' :: ' + e.message.slice(0, 140)); } };
const richOK = (text, where) => { if (!text) return; const parts = String(text).split('$'); if (parts.length % 2 === 0) fail('dollar ' + where, text); parts.forEach((p, i) => { if (i % 2) texOK(p, where); }); };
const FAMS = { ibp: M.IBP_FAMILIES, trig: M.TRIG_FAMILIES, tsub: M.TSUB_FAMILIES, pf: M.PF_FAMILIES, imp: M.IMP_FAMILIES };
const units = ['ibp', 'trig', 'tsub', 'pf', 'imp'];
let nSc = 0, nSteps = 0;
for (const u of units) {
  const g = M.GUIDE[u];
  if (!g) { fail('missing', u); continue; }
  richOK(g.big, u + ' big'); texOK(g.formula, u + ' formula');
  g.recipe.forEach((r, i) => { richOK(r.d, `${u} recipe ${i}`); if (!r.t) fail('recipeTitle', u); });
  const keys = new Set();
  for (const s of g.scenarios) {
    nSc++;
    const w = `${u}/${s.key}`;
    if (keys.has(s.key)) fail('dupKey', w); keys.add(s.key);
    ['name', 'spot', 'pattern', 'example', 'trap'].forEach((k) => { if (!s[k]) fail('field ' + k, w); });
    texOK(s.pattern, w + ' pattern'); texOK(s.example, w + ' example'); richOK(s.spot, w + ' spot'); richOK(s.trap, w + ' trap');
    if (s.twin) { texOK(s.twin.tex, w + ' twin'); }
    if (s.steps.length < 3) fail('fewSteps', w);
    s.steps.forEach((st, i) => { nSteps++; if (!st.t) fail('stepTitle', w + i); richOK(st.d, `${w} step ${i}`); (st.m || []).forEach((l) => texOK(l, `${w} step ${i}`)); if (!(st.m || []).length) fail('stepNoMath', w + i); });
    for (const f of s.families) if (!FAMS[u][f]) fail('family', `${w}: ${f}`);
    // the worked example is right
    const v = s.verify;
    if (!v) { fail('noVerify', w); continue; }
    if (v.f && v.dom) { const pts = M.points(v.dom, 12, 5); if (!M.derivMatches(v.F, v.f, pts)) fail('deriv', w); }
    if (v.value != null) { const got = v.F(v.hi) - v.F(v.lo); if (Math.abs(got - v.value) > 1e-5 * Math.max(1, Math.abs(v.value))) fail('value', `${w} ${got} vs ${v.value}`); }
    if (v.diverges) { const got = v.F(v.hi) - v.F(v.lo); if (!(Math.abs(got) > 1e6)) fail('diverges', `${w} ${got}`); }
  }
}
// every problem the app makes has a step list
for (const u of units) for (let level = 1; level <= 3; level++) for (let i = 0; i < 150; i++) {
  const p = M.generate(u, level, M.rng(700 * level + i + u.length));
  const sc = M.guideScenario(u, p);
  if (!sc) fail('noScenario', `${u} ${p.family} ${p.tex}`);
}
// "Try one" on a scenario makes a problem of that scenario, at every level
let nTry = 0;
for (const u of units) for (const s of M.GUIDE[u].scenarios) {
  for (const f of s.families) for (let level = 1; level <= 3; level++) {
    try { const p = M.generate(u, level, M.rng(9100 + 37 * level + f.length), f); if (p.family !== f) fail('tryFamily', `${u}/${s.key} asked ${f} got ${p.family}`); } catch (e) { fail('tryGen', `${u}/${s.key} ${f} L${level}: ${e.message}`); }
  }
  for (const f of s.families) for (let level = 1; level <= 3; level++) {
    // "Same type again" asks for the family and must stay in the scenario
    const p = M.guideTry(u, s.key, level, M.rng(31 * level + f.length), f);
    const back = p && M.guideScenario(u, p);
    if (!(back && (back.key === s.key || (s.key === 'p_test' && /^p_/.test(p.family))))) fail('tryPrefer', `${u}/${s.key} ${f} L${level} -> ${back && back.key}`);
  }
  for (let level = 1; level <= 3; level++) for (let i = 0; i < 30; i++) {
    nTry++;
    const p = M.guideTry(u, s.key, level, M.rng(9100 + 37 * level + i * 7 + s.key.length));
    const back = p && M.guideScenario(u, p);
    const okKey = back && (back.key === s.key || (s.key === 'p_test' && /^p_/.test(p.family)));
    if (!okKey) fail('tryScenario', `${u}/${s.key} L${level} -> ${back && back.key} ${p && p.tex}`);
  }
}
// Which-method tree
const W = M.WHICH, seen = new Set(['start']);
const target = (t, from) => {
  if (!t) return fail('whichTarget', from);
  if (t.startsWith('S:')) { const [u, k] = t.slice(2).split('/'); if (!M.GUIDE[u] || !M.GUIDE[u].scenarios.some((s) => s.key === k)) fail('whichScenario', t); return; }
  if (t.startsWith('L:')) { if (!M.WHICH_LEAVES[t.slice(2)]) fail('whichLeaf', t); return; }
  if (!W[t]) fail('whichNode', t); seen.add(t);
};
for (const [k, n] of Object.entries(W)) {
  (n.ex || []).forEach((t) => texOK(t, 'which ex ' + k));
  if (n.choices) n.choices.forEach((c) => { if (c.tex) texOK(c.tex, 'which choice ' + k); target(c.to, k); });
  else { target(n.yes, k); target(n.no, k); }
}
Object.keys(W).forEach((k) => { if (!seen.has(k)) fail('whichUnreachable', k); });
const reached = new Set(); Object.values(W).forEach((n) => { (n.choices || []).forEach((c) => reached.add(c.to)); [n.yes, n.no].forEach((t) => t && reached.add(t)); });
// no math may lose its backslashes: a stray tab, form feed, or "frac" without "\" means a raw-string slip
const allTex = []; for (const u of units) for (const s of M.GUIDE[u].scenarios) { allTex.push(s.pattern, s.example, ...s.steps.flatMap((x) => x.m || [])); }
allTex.forEach((t) => { if (/[\t\f\r\v\b]|(^|[^\\a-zA-Z])(frac|sqrt|left|right|cdot|qquad|tfrac|text|sin|cos|tan|sec|ln|arctan)\b/.test(t)) fail('lostBackslash', JSON.stringify(t)); });
for (const u of units) for (const s of M.GUIDE[u].scenarios) if (![...reached].includes(`S:${u}/${s.key}`)) fail('scenarioNotInWhich', `${u}/${s.key}`);
Object.values(M.WHICH_LEAVES).forEach((l) => richOK(l.text, 'leaf'));
console.log(`scenarios: ${nSc}  steps: ${nSteps}  tex checks: ${checks}  try-one problems: ${nTry}  fails: ${fails}`);
