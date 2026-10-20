const fs = require('fs');
const katex = require('katex');
for (const n of ['engine','gen_common','gen_ibp','gen_trig','gen_tsub','gen_pf']) { const p = __dirname + '/../src/' + n + '.js'; if (fs.existsSync(p)) require(p); }
const M = globalThis.M;
const units = (process.argv[2] || 'ibp').split(',');
const N = +(process.argv[3] || 300);
let fails = 0, count = 0;
const errs = {};
function fail(key, msg) { fails++; errs[key] = (errs[key] || 0) + 1; if (errs[key] <= 3) console.log('FAIL', key, msg); }
function texOK(tex, where) {
  try { katex.renderToString(tex, { throwOnError: true, displayMode: true, trust: (c) => c.command === '\\htmlClass', strict: false }); }
  catch (e) { fail('katex:' + where, tex + '  ::  ' + e.message.slice(0, 120)); }
}
function richOK(text, where) { // $...$ segments
  if (!text) return;
  const parts = String(text).split('$');
  if (parts.length % 2 === 0) fail('dollar:' + where, text);
  parts.forEach((p, i) => { if (i % 2 === 1) texOK(p, where); });
}
const fams = {};
for (const u of units) {
  for (let level = 1; level <= 3; level++) {
    for (let i = 0; i < N; i++) {
      const r = M.rng(1000 * level + i + u.length * 77);
      let p;
      try { p = M.generate(u, level, r); } catch (e) { fail('gen:' + u, e.stack.split('\n').slice(0, 3).join(' | ')); continue; }
      count++;
      const key = `${u}/${p.family}`;
      fams[key] = (fams[key] || 0) + 1;
      const pts = M.points(p.domain, 9, 11);
      // 1. answer derivative == integrand
      if (!M.derivMatches(p.answer.f, p.f, pts)) fail('deriv:' + key, p.tex + ' ans ' + p.answer.tex);
      // definite value
      if (p.definite) {
        const v = p.definite.F(p.definite.hi[1]) - p.definite.F(p.definite.lo[1]);
        if (Math.abs(v - p.definite.value) > 1e-9) fail('defval:' + key, p.tex + ' ' + v + ' vs ' + p.definite.value);
      }
      // abs domain sanity
      if (p.absDomain) { const p2 = M.points(p.absDomain, 7, 5); if (!M.derivMatches(p.answer.f, p.f, p2)) fail('absdom:' + key, p.tex); }
      // 2. ascii parses & grades correct
      const g = M.gradeAntiderivative(p.answer.ascii + ' + C', p);
      if (g.verdict !== 'correct') fail('grade:' + key, p.answer.ascii + ' -> ' + g.verdict + ' ' + JSON.stringify(g.notes.slice(0,2)));
      const g2 = M.gradeAntiderivative(p.answer.ascii, p);
      if (!p.definite && (g2.verdict !== 'almost' || g2.score !== 12 - 1)) fail('gradeNoC:' + key, g2.verdict + ' ' + g2.score);
      // mistakes graded wrong + diagnosed
      for (const m of p.mistakes) {
        if (M.equivConst(m.f, p.answer.f, pts).ok) fail('mistakeEquiv:' + key, m.tex);
        texOK(m.tex, 'mistake ' + key);
        richOK(m.msg, 'mistakeMsg ' + key);
      }
      // 3. tex
      texOK(p.tex, 'problem ' + key); texOK(p.answer.tex + ' + C', 'answer ' + key);
      const sp = M.speak(p.tex);
      if (/[\\{}]/.test(sp)) fail('speech:' + key, sp);
      (p.hints || []).forEach((h) => richOK(h, 'hint ' + key));
      // 4. steps
      let pointsSum = 0, hasFinal = false;
      p.steps.forEach((s, si) => {
        richOK(s.think, 'think ' + key);
        (s.lines || []).forEach((l) => texOK(l, `line ${key} #${si}`));
        const c = s.check; if (!c) return;
        pointsSum += c.points || 0;
        if (c.kind === 'choice') {
          const oks = c.options.filter((o) => o.ok).length;
          if (oks !== 1) fail('choiceOk:' + key, s.title + ' oks=' + oks);
          const shown = c.options.map((o) => o.tex || o.text); if (new Set(shown).size !== shown.length) fail('choiceDup:' + key, s.title + ' ' + JSON.stringify(shown));
          c.options.forEach((o) => { if (o.tex) texOK(o.tex, 'opt ' + key); if (o.text) richOK(o.text, 'optText ' + key); richOK(o.msg, 'optMsg ' + key); });
          richOK(c.prompt, 'prompt ' + key);
        } else if (c.kind === 'expr') {
          const vv = (c.vars || ['x'])[0];
          const dpts = M.points(c.domain || [0.3, 1.3], 8, 3);
          if (!dpts.every((x) => Number.isFinite(c.expect(x)))) fail('exprFinite:' + key, s.title);
          texOK(c.promptTex + ' ' + (c.suffixTex || ''), 'promptTex ' + key);
          texOK(c.answerTex, 'answerTex ' + key);
          for (const m of c.mistakes || []) {
            const same = c.exact ? M.equalFns(m.f, c.expect, dpts) : M.equivConst(m.f, c.expect, dpts).ok;
            if (same) fail('stepMistakeSame:' + key, s.title + ' ' + m.msg);
            richOK(m.msg, 'stepMsg ' + key);
          }
          if (c.ascii) { const res = M.checkStepExpr(c.ascii, c); if (!res.ok) fail('stepAscii:' + key, s.title + ' ' + c.ascii); }
        } else if (c.kind === 'num') {
          if (!Number.isFinite(c.expect)) fail('numFinite:' + key, s.title);
          texOK(c.promptTex, 'numPrompt ' + key); texOK(c.answerTex, 'numAns ' + key);
        } else if (c.kind === 'final') hasFinal = true;
      });
      if (!hasFinal && !p.definite) fail('noFinal:' + key, '');
      if (pointsSum !== p.outOf) fail('outOf:' + key, pointsSum + ' vs ' + p.outOf);
      // 5. MC
      if (!p.noMC) {
        const opts = M.makeMC(p, M.rng(i));
        if (opts.length !== 4) fail('mcLen:' + key, opts.length + ' ' + p.tex);
        if (opts.filter((o) => o.correct).length !== 1) fail('mcCorrect:' + key, '');
        const fns = opts.map((o) => (o.correct ? p.answer.f : o.f));
        for (let a = 0; a < fns.length; a++) for (let b = a + 1; b < fns.length; b++) if (M.equivConst(fns[a], fns[b], pts).ok) fail('mcDup:' + key, opts[a].tex + ' == ' + opts[b].tex);
        opts.forEach((o) => texOK(o.tex, 'mc ' + key));
      }
    }
  }
}
console.log('problems:', count, 'fails:', fails);
console.log(Object.entries(fams).map(([k, v]) => `${k}:${v}`).join('  '));
console.log(JSON.stringify(errs));
