const fs=require('fs'); for (const n of ['engine','gen_common','gen_ibp','gen_trig','gen_tsub','gen_pf']) require(__dirname+'/../src/'+n+'.js');
const M=globalThis.M; let bad=0, n=0;
const variants = (a) => [a.replace(/\*/g,''), a.replace(/\s+/g,''), a.replace(/\*/g,' '), a.replace(/abs\(([^()]*)\)/g,'|$1|')];
for (const u of ['ibp','trig','tsub','pf']) for (let L=1; L<=3; L++) for (let i=0;i<150;i++) {
  const p = M.generate(u, L, M.rng(i*7+L)); if (p.definite) continue;
  for (const v of variants(p.answer.ascii + ' + C')) { n++; const g = M.gradeAntiderivative(v, p, p.outOf); if (g.verdict!=='correct') { bad++; if (bad<8) console.log('BAD', u, p.family, JSON.stringify(v), g.verdict, g.notes[0] && g.notes[0].text); } }
}
console.log('variants', n, 'bad', bad);
