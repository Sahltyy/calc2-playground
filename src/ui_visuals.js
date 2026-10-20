/* ==========================================================================
   VISUALS — lesson visuals and the trig-sub triangle
   Each renderer returns {html, mount(el)}.
   ========================================================================== */
(function (G) {
'use strict';
const M = G.M, UI = G.UI;
const T = UI.tex, R = UI.rich, I = UI.I;

/* ---------- reference triangle ---------- */
UI.triangle = function ({ opp, adj, hyp, hi = [] }) {
  const on = (s) => (hi.includes(s) ? 'var(--pink)' : 'var(--ink)');
  const w = (s) => (hi.includes(s) ? 5 : 3);
  return `<div class="tri-wrap">
    <svg viewBox="0 0 420 250" aria-hidden="true">
      <path d="M40 210 L330 210" stroke="${on('adj')}" stroke-width="${w('adj')}" stroke-linecap="round" fill="none"/>
      <path d="M330 210 L330 40" stroke="${on('opp')}" stroke-width="${w('opp')}" stroke-linecap="round" fill="none"/>
      <path d="M40 210 L330 40" stroke="${on('hyp')}" stroke-width="${w('hyp')}" stroke-linecap="round" fill="none"/>
      <path d="M312 210 L312 192 L330 192" stroke="var(--ink-3)" stroke-width="2" fill="none"/>
      <path d="M92 210 A52 52 0 0 0 85 184" stroke="var(--u)" stroke-width="2.5" fill="none"/>
    </svg>
    <span class="lab" style="left:44%;top:93%">${T(adj)}</span>
    <span class="lab" style="left:80.5%;top:50%;transform:translate(0,-50%)">${T(opp)}</span>
    <span class="lab" style="left:37%;top:40%">${T(hyp)}</span>
    <span class="lab" style="left:26%;top:78%;background:none">${T('\\theta')}</span>
  </div>`;
};

/* ---------- simple renderers ---------- */
const VIS = (UI.VIS = {});
VIS.tex = (v) => ({ html: `<div class="viz tex-lines">${v.lines.map((l) => T(l, true)).join('')}</div>` });
VIS.cards = (v) => ({ html: `<div class="idcards">${v.items.map((it) => `<div class="idcard"><div class="eyebrow">${UI.esc(it.label)}</div>${T(it.tex, true)}</div>`).join('')}</div>` });
VIS.traps = (v) => ({ html: `<div class="trapcards">${v.items.map((it) => `<div class="trapcard"><span class="x">✗</span><div class="bad">${T(it.bad)}</div><div class="why">${R(it.why)}</div></div>`).join('')}</div>` });
VIS.steps = (v) => ({ html: `<div class="steplist">${v.items.map((s) => `<div>${R(s)}</div>`).join('')}</div>` });
VIS.reveal = (v) => ({
  html: `<div class="viz"><div class="reveal-lines">${v.lines.map((l, i) => `<div class="reveal-line ${i === 0 ? 'shown' : ''}">${T(l, true)}</div>`).join('')}</div>
    <div class="controls"><button class="btn sm accent" data-r="next">Show next line ${I.next}</button><button class="btn sm ghost" data-r="all">Show all</button></div></div>`,
  mount(el) {
    const lines = [...el.querySelectorAll('.reveal-line')];
    const nb = el.querySelector('[data-r="next"]');
    const upd = () => { const left = lines.filter((l) => !l.classList.contains('shown')).length; if (!left) { nb.disabled = true; nb.innerHTML = 'All lines shown'; } };
    nb.onclick = () => { const n = lines.find((l) => !l.classList.contains('shown')); if (n) n.classList.add('shown'); UI.Sound.play('tick'); upd(); };
    el.querySelector('[data-r="all"]').onclick = () => { lines.forEach((l) => l.classList.add('shown')); upd(); };
  },
});

/* ---------- IBP: area picture ---------- */
VIS.area = () => {
  const g = (u) => 0.35 + 1.25 * Math.sqrt(u);
  const u1 = 0.6;
  const W = 360, H = 260, ox = 36, oy = 230, sx = 60, sy = 60;
  const X = (u) => ox + u * sx, Y = (v) => oy - v * sy;
  function svg(U) {
    const v1 = g(u1), v2 = g(U);
    const pts = []; for (let i = 0; i <= 40; i++) { const u = u1 + ((U - u1) * i) / 40; pts.push([u, g(u)]); }
    const under = `M${X(u1)},${Y(0)} ` + pts.map(([u, v]) => `L${X(u)},${Y(v)}`).join(' ') + ` L${X(U)},${Y(0)} Z`;
    const left = `M${X(0)},${Y(v1)} ` + pts.map(([u, v]) => `L${X(u)},${Y(v)}`).join(' ') + ` L${X(0)},${Y(v2)} Z`;
    const curve = []; for (let i = 0; i <= 60; i++) { const u = 0.05 + (4.9 * i) / 60; curve.push(`${i ? 'L' : 'M'}${X(u)},${Y(g(u))}`); }
    return `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Area picture of integration by parts">
      <path d="${left}" fill="var(--pink-hl)" stroke="none"/>
      <path d="${under}" fill="var(--lav-hl)" stroke="none"/>
      <rect x="${X(0)}" y="${Y(v1)}" width="${u1 * sx}" height="${v1 * sy}" fill="var(--line)"/>
      <rect x="${X(0)}" y="${Y(v2)}" width="${U * sx}" height="${v2 * sy}" fill="none" stroke="var(--ink)" stroke-dasharray="5 4" stroke-width="1.5"/>
      <path d="${curve.join(' ')}" fill="none" stroke="var(--ink)" stroke-width="2.5"/>
      <path d="M${ox},${oy} H${W - 6} M${ox},${oy} V10" stroke="var(--ink-3)" stroke-width="1.5"/>
      <text x="${W - 14}" y="${oy + 18}" fill="var(--ink-2)" font-size="14">u</text>
      <text x="${ox - 22}" y="20" fill="var(--ink-2)" font-size="14">v</text>
      <circle cx="${X(U)}" cy="${Y(v2)}" r="6" fill="var(--u)"/>
      <text x="${X(u1 + (U - u1) / 2) - 18}" y="${Y(g(u1 + (U - u1) / 2) / 2) + 5}" fill="var(--ink)" font-size="13" font-weight="600">∫v du</text>
      <text x="${X(0) + 6}" y="${Y((v1 + v2) / 2) + 5}" fill="var(--ink)" font-size="13" font-weight="600">∫u dv</text>
    </svg>`;
  }
  const area = (U) => {
    const v1 = g(u1), v2 = g(U); let a1 = 0; const n = 400;
    for (let i = 0; i < n; i++) { const u = u1 + ((U - u1) * (i + 0.5)) / n; a1 += g(u) * ((U - u1) / n); }
    const big = U * v2 - u1 * v1;
    return { vdu: a1, udv: big - a1, big };
  };
  return {
    html: `<div class="viz"><div class="area-svg">${svg(3)}</div>
      <div class="controls"><span class="eyebrow">drag</span><input type="range" min="1.2" max="4.8" step="0.01" value="3" aria-label="Move the endpoint"></div>
      <div class="legend"><span><i style="background:var(--pink-hl)"></i>${T('\\int u\\,dv')} = <b class="tnum" data-a="udv"></b></span><span><i style="background:var(--lav-hl)"></i>${T('\\int v\\,du')} = <b class="tnum" data-a="vdu"></b></span><span>sum = <b class="tnum" data-a="sum"></b> = ${T('[uv]')}</span></div></div>`,
    mount(el) {
      const box = el.querySelector('.area-svg'), sl = el.querySelector('input');
      const upd = () => { const U = +sl.value; box.innerHTML = svg(U); const a = area(U); el.querySelector('[data-a="udv"]').textContent = a.udv.toFixed(2); el.querySelector('[data-a="vdu"]').textContent = a.vdu.toFixed(2); el.querySelector('[data-a="sum"]').textContent = a.big.toFixed(2); };
      sl.oninput = upd; upd();
    },
  };
};

/* ---------- IBP: LIATE ladder + mini game ---------- */
VIS.liate = () => {
  const rungs = [['L', 'Logs', '\\ln x'], ['I', 'Inverse trig', '\\arctan x,\\ \\arcsin x'], ['A', 'Algebraic', 'x,\\ x^{2},\\ \\sqrt{x}'], ['T', 'Trig', '\\sin x,\\ \\cos x'], ['E', 'Exponential', 'e^{x},\\ 2^{x}']];
  const pairs = [
    { a: ['x^{3}', 2], b: ['\\ln x', 0] },
    { a: ['x^{2}', 2], b: ['e^{2x}', 4] },
    { a: ['\\arctan x', 1], b: ['x', 2] },
    { a: ['\\cos 3x', 3], b: ['x', 2] },
    { a: ['e^{x}', 4], b: ['\\sin x', 3] },
  ];
  return {
    html: `<div class="viz"><div class="liate">${rungs.map((r, i) => `<div class="rung" data-i="${i}"><span class="L">${r[0]}</span><span><b>${r[1]}</b> <span class="ex">${T(r[2])}</span></span><span class="eyebrow">${i === 0 ? 'pick first' : i === 4 ? 'pick last' : ''}</span></div>`).join('')}</div>
      <div class="liate-game"><div class="eyebrow">Quick drill: tap the one that should be u</div><div class="pair"></div><div class="lg-fb"></div></div></div>`,
    mount(el) {
      let k = 0, score = 0;
      const pairEl = el.querySelector('.pair'), fb = el.querySelector('.lg-fb');
      const show = () => {
        el.querySelectorAll('.rung').forEach((r) => r.classList.remove('hit'));
        if (k >= pairs.length) { pairEl.innerHTML = `<b>${score}/${pairs.length}</b>&nbsp;on the LIATE drill. ${score === pairs.length ? 'Perfect.' : 'Run it back anytime.'}`; fb.innerHTML = ''; return; }
        const p = pairs[k]; const opts = Math.random() < 0.5 ? [p.a, p.b] : [p.b, p.a];
        pairEl.innerHTML = `${T('\\int')} ${opts.map((o, i) => `<button class="btn sm soft" data-o="${i}">${T(o[0])}</button>`).join(`<span class="muted">${T('\\cdot')}</span>`)} ${T('\\,dx')}`;
        pairEl.querySelectorAll('[data-o]').forEach((b) => (b.onclick = () => {
          const pick = opts[+b.dataset.o], other = opts[1 - +b.dataset.o];
          el.querySelector(`.rung[data-i="${pick[1]}"]`).classList.add('hit');
          el.querySelector(`.rung[data-i="${other[1]}"]`).classList.add('hit');
          const ok = pick[1] < other[1];
          if (ok) score++;
          UI.Sound.play(ok ? 'good' : 'bad');
          fb.innerHTML = `<div class="feedback ${ok ? 'good' : 'bad'}"><span class="mark">${ok ? '✓' : '✗'}</span><span>${ok ? 'Yes.' : 'Not this time.'} ${R(`$${(ok ? pick : other)[0]}$`)} is higher on the ladder, so it is $u$.</span></div>`.replace('$u$', T('u'));
          k++; setTimeout(show, 1300);
        }));
      };
      show();
    },
  };
};

/* ---------- IBP: 4-box ---------- */
VIS.box = (v) => ({
  html: `<div class="viz"><div class="box4"><div class="uu"><span class="lbl">u</span><span class="val">${T(v.u)}</span></div><div class="vv"><span class="lbl">dv</span><span class="val">${T(v.dv)}</span></div><div class="dd"><span class="lbl">du</span><span class="val">${T(v.du)}</span></div><div class="vv"><span class="lbl">v</span><span class="val">${T(v.v)}</span></div></div>
    <div class="box-arrows"><span>↓ differentiate</span><span>integrate ↓</span></div>
    <div class="box-res" style="opacity:0;transition:opacity .4s">${T(v.result, true)}</div>
    <div class="controls"><button class="btn sm accent" data-b="fill">Fill the box ${I.next}</button></div></div>`,
  mount(el) {
    const vals = [...el.querySelectorAll('.val')];
    const order = [0, 1, 2, 3];
    let i = 0;
    el.querySelector('[data-b="fill"]').onclick = (e) => {
      if (i < 4) { vals[order[i]].classList.add('shown'); UI.Sound.play('tick'); i++; if (i === 4) e.currentTarget.innerHTML = 'Read off the answer'; }
      else { el.querySelector('.box-res').style.opacity = 1; e.currentTarget.disabled = true; }
    };
  },
});

/* ---------- IBP: DI table ---------- */
VIS.di = () => {
  const D = ['x^{2}', '2x', '2', '0'], Iv = ['e^{x}', 'e^{x}', 'e^{x}', 'e^{x}'], S = ['+', '-', '+'];
  const terms = ['+x^{2}e^{x}', '-2x\\,e^{x}', '+2e^{x}'];
  const rowH = 54;
  return {
    html: `<div class="viz"><div class="di" style="position:relative">
      <div style="display:grid;grid-template-columns:48px 1fr 1fr;row-gap:0">
        <div class="eyebrow" style="text-align:center">sign</div><div class="eyebrow" style="text-align:center">D</div><div class="eyebrow" style="text-align:center">I</div>
        ${D.map((d, i) => `<div style="height:${rowH}px;display:grid;place-items:center;font-weight:700;color:var(--u)">${S[i] || ''}</div><div style="height:${rowH}px;display:grid;place-items:center">${T(d)}</div><div style="height:${rowH}px;display:grid;place-items:center">${T(Iv[i])}</div>`).join('')}
      </div>
      <svg class="di-arrows" viewBox="0 0 300 ${rowH * 4}" preserveAspectRatio="none" style="position:absolute;left:0;right:0;top:22px;width:100%;height:${rowH * 4}px;pointer-events:none"></svg>
    </div>
    <div class="di-sum" style="min-height:48px">${T('\\int x^{2}e^{x}dx = ', true)}</div>
    <div class="controls"><button class="btn sm accent" data-d="go">Next diagonal ${I.next}</button><button class="btn sm ghost" data-d="reset">${I.reset} Reset</button></div></div>`,
    mount(el) {
      let k = 0;
      const svg = el.querySelector('.di-arrows'), sum = el.querySelector('.di-sum');
      const draw = () => {
        let s = '';
        for (let i = 0; i < k; i++) {
          const y1 = rowH * i + rowH / 2, y2 = rowH * (i + 1) + rowH / 2;
          s += `<line x1="150" y1="${y1}" x2="236" y2="${y2 - 8}" stroke="var(--pink)" stroke-width="2.5" vector-effect="non-scaling-stroke" stroke-linecap="round"/>`;
        }
        svg.innerHTML = s;
        sum.innerHTML = T('\\int x^{2}e^{x}dx = ' + (k ? terms.slice(0, k).join(' ').replace(/^\+/, '') : '\\;\\dots') + (k === 3 ? ' + C' : ''), true);
      };
      el.querySelector('[data-d="go"]').onclick = (e) => { if (k < 3) { k++; draw(); UI.Sound.play(k === 3 ? 'good' : 'tick'); } if (k === 3) e.currentTarget.disabled = true; };
      el.querySelector('[data-d="reset"]').onclick = () => { k = 0; el.querySelector('[data-d="go"]').disabled = false; draw(); };
      draw();
    },
  };
};

/* ---------- IBP: boomerang ---------- */
VIS.boomerang = () => VIS.reveal({ lines: [
  '\\htmlClass{hk}{I} = \\int e^{x}\\sin x\\,dx',
  '= e^{x}\\sin x - \\int e^{x}\\cos x\\,dx \\quad(\\text{round 1})',
  '= e^{x}\\sin x - \\left(e^{x}\\cos x + \\htmlClass{hk}{\\int e^{x}\\sin x\\,dx}\\right) \\quad(\\text{round 2})',
  '\\htmlClass{hk}{I} = e^{x}\\sin x - e^{x}\\cos x - \\htmlClass{hk}{I} \\quad(\\text{it came back!})',
  '2\\htmlClass{hk}{I} = e^{x}(\\sin x - \\cos x) \\;\\Rightarrow\\; \\htmlClass{hk}{I} = \\tfrac{1}{2}e^{x}(\\sin x - \\cos x) + C',
] });

/* ---------- trig: decision tree ---------- */
VIS.flow = () => {
  const leaf = (cond, act) => `<div style="padding:10px 12px;border-radius:12px;background:var(--card);border:1px solid var(--line)"><div class="eyebrow" style="color:var(--u)">${R(cond)}</div><div style="font-size:14.5px;margin-top:2px">${R(act)}</div></div>`;
  const col = (title, leaves) => `<div style="display:flex;flex-direction:column;gap:8px;min-width:0"><div style="font-family:var(--font-display);font-weight:700;font-size:19px">${R(title)}</div><div style="display:flex;flex-direction:column;gap:8px;border-left:3px solid var(--u-hl);padding-left:12px">${leaves.join('')}</div></div>`;
  return { html: `<div class="viz"><div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:16px">
    ${col('$\\int\\sin^{m}x\\cos^{n}x\\,dx$', [leaf('$m$ odd', 'Save one $\\sin x$. Rest → $\\cos$. $u = \\cos x$'), leaf('$n$ odd', 'Save one $\\cos x$. Rest → $\\sin$. $u = \\sin x$'), leaf('both even', 'Half-angle identities')])}
    ${col('$\\int\\tan^{m}x\\sec^{n}x\\,dx$', [leaf('$n$ even', 'Save $\\sec^{2}x$. Rest → $\\tan$. $u = \\tan x$'), leaf('$m$ odd', 'Save $\\sec x\\tan x$. Rest → $\\sec$. $u = \\sec x$'), leaf('neither', 'Rewrite in $\\sin$/$\\cos$, or parts (like $\\sec^3$)')])}
  </div></div>` };
};

/* ---------- trig: half-angle wave ---------- */
VIS.halfwave = () => {
  const W = 380, H = 200, ox = 24, oy = 170, sx = (W - 40) / (2 * Math.PI), sy = 130;
  const path = (f) => { let s = ''; for (let i = 0; i <= 160; i++) { const x = (2 * Math.PI * i) / 160; s += `${i ? 'L' : 'M'}${(ox + x * sx).toFixed(1)},${(oy - f(x) * sy).toFixed(1)}`; } return s; };
  return {
    html: `<div class="viz"><svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Graph of sine squared next to its half-angle form">
      <path d="M${ox},${oy} H${W - 8}" stroke="var(--ink-3)" stroke-width="1.2"/>
      <path d="M${ox},${oy - sy} H${W - 8}" stroke="var(--line-2)" stroke-dasharray="3 4"/>
      <path class="hw-half" d="M${ox},${oy - sy / 2} H${W - 8}" stroke="var(--butter)" stroke-width="2" stroke-dasharray="6 5"/>
      <path class="hw-cos" d="${path((x) => 0.5 - 0.5 * Math.cos(2 * x))}" stroke="var(--lav)" stroke-width="7" fill="none" opacity="0.35"/>
      <path class="hw-sin" d="${path((x) => Math.sin(x) ** 2)}" stroke="var(--pink)" stroke-width="2.6" fill="none"/>
      <text x="${W - 12}" y="${oy - sy / 2 - 6}" text-anchor="end" font-size="12" fill="var(--butter)">y = 1/2</text>
      <text x="${ox + 2}" y="${oy - sy - 6}" font-size="12" fill="var(--ink-3)">1</text>
      <text x="${ox + Math.PI * sx}" y="${oy + 16}" text-anchor="middle" font-size="12" fill="var(--ink-3)">π</text>
      <text x="${ox + 2 * Math.PI * sx}" y="${oy + 16}" text-anchor="end" font-size="12" fill="var(--ink-3)">2π</text>
    </svg>
    <div class="legend"><span><i style="background:var(--pink)"></i>${T('\\sin^{2}x')}</span><span><i style="background:var(--lav);opacity:.5"></i>${T('\\frac{1}{2} - \\frac{1}{2}\\cos 2x')}</span><span><i style="background:var(--butter)"></i>average height ${T('\\tfrac12')}</span></div>
    <div class="muted" style="font-size:14px;margin-top:6px">The thick and thin curves lie exactly on top of each other: same function. Integrating the right side is easy.</div></div>`,
  };
};

/* ---------- trig sub: three triangles ---------- */
VIS.triangles = () => {
  const forms = [
    { k: 'a² − x²', sub: 'x = a\\sin\\theta', id: '1 - \\sin^{2}\\theta = \\cos^{2}\\theta', th: '\\theta = \\arcsin\\tfrac{x}{a}', tri: { opp: 'x', adj: '\\sqrt{a^{2}-x^{2}}', hyp: 'a', hi: ['opp', 'hyp'] } },
    { k: 'a² + x²', sub: 'x = a\\tan\\theta', id: '1 + \\tan^{2}\\theta = \\sec^{2}\\theta', th: '\\theta = \\arctan\\tfrac{x}{a}', tri: { opp: 'x', adj: 'a', hyp: '\\sqrt{a^{2}+x^{2}}', hi: ['opp', 'adj'] } },
    { k: 'x² − a²', sub: 'x = a\\sec\\theta', id: '\\sec^{2}\\theta - 1 = \\tan^{2}\\theta', th: '\\theta = \\operatorname{arcsec}\\tfrac{x}{a}', tri: { opp: '\\sqrt{x^{2}-a^{2}}', adj: 'a', hyp: 'x', hi: ['hyp', 'adj'] } },
  ];
  const body = (f) => `${UI.triangle(f.tri)}<div class="tri-info">${T(f.sub, true)}<div class="muted" style="font-size:14px">${T(f.id)} &nbsp;·&nbsp; ${T(f.th)}</div></div>`;
  return {
    html: `<div class="viz"><div class="tri-tabs seg">${forms.map((f, i) => `<button data-t="${i}" aria-pressed="${i === 0}">${T('\\sqrt{' + f.k.replace('²', '^{2}').replace('²', '^{2}').replace('−', '-') + '}')}</button>`).join('')}</div><div class="tri-body">${body(forms[0])}</div></div>`,
    mount(el) {
      el.querySelectorAll('[data-t]').forEach((b) => (b.onclick = () => {
        el.querySelectorAll('[data-t]').forEach((x) => x.setAttribute('aria-pressed', 'false'));
        b.setAttribute('aria-pressed', 'true');
        el.querySelector('.tri-body').innerHTML = body(forms[+b.dataset.t]);
        UI.Sound.play('tick');
      }));
    },
  };
};
VIS.triangleRead = () => {
  const sides = { opp: 'x', adj: '\\sqrt{9-x^{2}}', hyp: '3' };
  const ratios = { sin: ['opp', 'hyp'], cos: ['adj', 'hyp'], tan: ['opp', 'adj'], csc: ['hyp', 'opp'], sec: ['hyp', 'adj'], cot: ['adj', 'opp'] };
  const read = (k) => `\\${k}\\theta = \\frac{\\text{${ratios[k][0]}}}{\\text{${ratios[k][1]}}} = \\frac{${sides[ratios[k][0]]}}{${sides[ratios[k][1]]}}`;
  return {
    html: `<div class="viz"><div class="tri-host">${UI.triangle({ ...sides, hi: ['opp', 'hyp'] })}</div>
      <div class="tri-info tri-read">${T(read('sin'), true)}</div>
      <div class="chips" style="justify-content:center">${Object.keys(ratios).map((k) => `<button data-k="${k}">${T('\\' + k + '\\theta')}</button>`).join('')}</div></div>`,
    mount(el) {
      el.querySelectorAll('[data-k]').forEach((b) => (b.onclick = () => {
        const k = b.dataset.k;
        el.querySelector('.tri-host').innerHTML = UI.triangle({ ...sides, hi: ratios[k] });
        el.querySelector('.tri-read').innerHTML = T(read(k), true);
        UI.Sound.play('tick');
      }));
    },
  };
};

/* ---------- partial fractions ---------- */
VIS.fractions = () => ({
  html: `<div class="viz fracs">
    <div class="frac-row"><span class="tile a">${T('\\frac{3}{x-2}')}</span><span>${T('+')}</span><span class="tile b">${T('\\frac{2}{x+1}')}</span></div>
    <div class="arrowdown" data-f="arrow">↓ common denominator</div>
    <div class="frac-row"><span class="tile big">${T('\\frac{3(x+1) + 2(x-2)}{(x-2)(x+1)} = \\frac{5x - 1}{x^{2}-x-2}')}</span></div>
    <div class="controls" style="justify-content:center"><button class="btn sm accent" data-f="flip">Run it backwards</button></div>
    <div class="muted fr-note" style="font-size:14px;text-align:center"></div></div>`,
  mount(el) {
    let back = false;
    el.querySelector('[data-f="flip"]').onclick = (e) => {
      back = !back;
      const rows = el.querySelectorAll('.frac-row');
      el.querySelector('.fracs').style.flexDirection = back ? 'column-reverse' : 'column';
      el.querySelector('.fracs').prepend(el.querySelector('.controls'));
      el.querySelector('[data-f="arrow"]').textContent = back ? '↑ partial fractions splits it apart' : '↓ common denominator';
      el.querySelector('.fr-note').innerHTML = back ? R('The hard fraction on the bottom becomes two easy ones: $3\\ln|x-2| + 2\\ln|x+1|$.') : '';
      e.currentTarget.textContent = back ? 'Run it forwards' : 'Run it backwards';
      rows.forEach((r) => r.animate([{ transform: 'scale(.96)', opacity: 0.4 }, { transform: 'none', opacity: 1 }], { duration: 350 }));
      UI.Sound.play('tick');
    };
  },
});
VIS.templates = () => ({
  html: `<div class="templates">
    ${[['Case 1', 'Distinct linear', '(x-a)', '\\frac{A}{x-a}'],
      ['Case 2', 'Repeated linear', '(x-a)^{2}', '\\frac{A}{x-a} + \\frac{B}{(x-a)^{2}}'],
      ['Case 3', 'Irreducible quadratic', 'x^{2}+k^{2}', '\\frac{Bx + C}{x^{2}+k^{2}}'],
      ['Case 4', 'Repeated quadratic', '(x^{2}+k^{2})^{2}', '\\frac{Bx + C}{x^{2}+k^{2}} + \\frac{Dx + E}{(x^{2}+k^{2})^{2}}'],
    ].map(([c, name, fac, piece]) => `<div class="tmpl"><div><div class="eyebrow">${c} · ${name}</div>${T(fac)}</div><span class="tmpl-arrow" aria-hidden="true">→</span><div>${T('\\displaystyle ' + piece)}</div></div>`).join('')}
  </div>`,
});
VIS.coverup = (v = {}) => {
  const num = v.num || '5x-1', f1 = v.f1 || '(x-2)', f2 = v.f2 || '(x+1)';
  const aLine = v.aLine || 'x = 2:\\quad A = \\frac{5(2)-1}{(2)+1} = \\frac{9}{3} = 3';
  const bLine = v.bLine || 'x = -1:\\quad B = \\frac{5(-1)-1}{(-1)-2} = \\frac{-6}{-3} = 2';
  return {
    html: `<div class="viz coverup">
    <div class="cu-frac"><div class="cu-num">${T(num)}</div><div class="cu-bar"></div>
      <div class="cu-den"><span class="cov"><span class="hand-cover"></span>${T(f1)}</span><span class="cov"><span class="hand-cover"></span>${T(f2)}</span></div></div>
    <div class="cu-out" style="min-height:72px"></div>
    <div class="controls" style="justify-content:center"><button class="btn sm accent" data-c="a">Cover ${T(f1)}, find A</button><button class="btn sm soft" data-c="b">Cover ${T(f2)}, find B</button></div></div>`,
    mount(el) {
      const covers = el.querySelectorAll('.hand-cover'), out = el.querySelector('.cu-out');
      el.querySelector('[data-c="a"]').onclick = () => { covers[0].classList.add('on'); covers[1].classList.remove('on'); out.innerHTML = T(aLine, true); UI.Sound.play('tick'); };
      el.querySelector('[data-c="b"]').onclick = () => { covers[1].classList.add('on'); covers[0].classList.remove('on'); out.innerHTML = T(bLine, true); UI.Sound.play('tick'); };
    },
  };
};

/* ---------- long division, one move at a time (class Example 1) ---------- */
VIS.longdiv = () => {
  // columns: x³, x², x, 1
  const rows = [
    { k: 'q', cells: ['', 'x^{2}', '+\\,x', '+\\,2'], at: [0, 1, 3, 5] },
    { k: 'd', cells: ['x^{3}', '+\\,0x^{2}', '+\\,x', '+\\,0'], at: 0 },
    { k: 's', cells: ['-(x^{3}', '-\\,x^{2})', '', ''], at: 2 },
    { k: 'r', cells: ['', 'x^{2}', '+\\,x', ''], at: 2 },
    { k: 's', cells: ['', '-(x^{2}', '-\\,x)', ''], at: 4 },
    { k: 'r', cells: ['', '', '2x', '+\\,0'], at: 4 },
    { k: 's', cells: ['', '', '-(2x', '-\\,2)'], at: 6 },
    { k: 'r rem', cells: ['', '', '', '2'], at: 6 },
  ];
  const say = [
    'Write every power. The missing ones get a 0.',
    'Divide the leading terms: $x^3 \\div x = x^2$. That goes on top.',
    'Multiply back: $x^2(x - 1) = x^3 - x^2$. Subtract it, then bring down the $x$.',
    'Divide again: $x^2 \\div x = x$.',
    'Multiply back: $x(x - 1) = x^2 - x$. Subtract, bring down the 0.',
    'Divide again: $2x \\div x = 2$.',
    'Multiply back: $2(x - 1) = 2x - 2$. Subtract. What is left (2) is the remainder.',
    'Answer: $\\frac{x^3 + x}{x - 1} = x^2 + x + 2 + \\frac{2}{x - 1}$.',
  ];
  const STEPS = 7;
  const cell = (c) => (c ? T(c) : '');
  return {
    html: `<div class="viz ldiv-wrap"><table class="ldiv" aria-label="Long division of x cubed plus x by x minus 1"><tbody>
      ${rows.map((r, ri) => `<tr class="ld-${r.k.split(' ')[0]}${r.k.includes('rem') ? ' ld-rem' : ''}" data-r="${ri}"><td class="ld-div">${ri === 1 ? T('x - 1\\,\\big)') : ''}</td>${r.cells.map((c, ci) => `<td data-c="${ci}">${cell(c)}</td>`).join('')}</tr>`).join('')}
    </tbody></table>
    <div class="ld-say" aria-live="polite"></div>
    <div class="controls"><button class="btn sm accent" data-l="next">Next move ${I.next}</button><button class="btn sm ghost" data-l="reset">${I.reset} Start over</button></div></div>`,
    mount(el) {
      let k = 0;
      const trs = [...el.querySelectorAll('tr')], sayEl = el.querySelector('.ld-say'), nb = el.querySelector('[data-l="next"]');
      const paint = () => {
        trs.forEach((tr, ri) => {
          const r = rows[ri];
          if (r.k === 'q') tr.querySelectorAll('td[data-c]').forEach((td) => { const ci = +td.dataset.c; td.classList.toggle('on', k >= r.at[ci]); });
          else tr.classList.toggle('on', k >= r.at);
        });
        sayEl.innerHTML = `<span class="ld-n">${k + 1}</span><span>${R(say[k])}</span>`;
        nb.disabled = k >= STEPS; nb.innerHTML = k >= STEPS ? 'Done' : `Next move ${I.next}`;
      };
      nb.onclick = () => { if (k < STEPS) { k++; UI.Sound.play(k >= STEPS ? 'good' : 'tick'); paint(); } };
      el.querySelector('[data-l="reset"]').onclick = () => { k = 0; paint(); };
      paint();
    },
  };
};

/* ---------- solving a system, one move at a time (class Example 2 done by elimination) ---------- */
VIS.moves = (v = {}) => {
  const A = '\\htmlClass{hu}{A}', B = '\\htmlClass{hv}{B}';
  const lines = v.lines || [
    `\\begin{aligned} ${A} + ${B} &= 5 \\\\ ${A} - 3${B} &= -3 \\end{aligned}`,
    `(${A} + ${B}) - (${A} - 3${B}) = 5 - (-3)`,
    `\\cancel{${A}} + ${B} - \\cancel{${A}} + 3${B} = 8`,
    `4${B} = 8 \\;\\Rightarrow\\; \\htmlClass{hv}{B = 2}`,
    `${A} + (2) = 5 \\;\\Rightarrow\\; \\htmlClass{hu}{A = 3}`,
    `\\text{Check: } (3) - 3(2) = -3 \\;\\checkmark`,
  ];
  const say = v.say || [
    'The system from matching coefficients. Both equations have exactly one $A$.',
    'Subtract the second equation from the first. Every term in it flips sign, the $-3$ too.',
    'The $A$\'s cancel. That is the whole point of eliminating.',
    'Only $B$ is left. Divide by 4.',
    'Plug $B = 2$ back into the easier equation to get $A$.',
    'Check both values in the equation you did not use. It works, so $A = 3$ and $B = 2$.',
  ];
  const last = lines.length - 1;
  return {
    html: `<div class="viz moves"><div class="mv-lines">${lines.map((l, i) => `<div class="mv-line" data-i="${i}">${T(l, true)}</div>`).join('')}</div>
      <div class="ld-say" aria-live="polite"></div>
      <div class="controls"><button class="btn sm accent" data-l="next">Next move ${I.next}</button><button class="btn sm ghost" data-l="reset">${I.reset} Start over</button></div></div>`,
    mount(el) {
      let k = 0;
      const rows = [...el.querySelectorAll('.mv-line')], sayEl = el.querySelector('.ld-say'), nb = el.querySelector('[data-l="next"]');
      const paint = () => {
        rows.forEach((row, i) => { row.classList.toggle('on', i <= k); row.classList.toggle('cur', i === k); });
        sayEl.innerHTML = `<span class="ld-n">${k + 1}</span><span>${R(say[k])}</span>`;
        nb.disabled = k >= last; nb.innerHTML = k >= last ? 'Done' : `Next move ${I.next}`;
      };
      nb.onclick = () => { if (k < last) { k++; UI.Sound.play(k >= last ? 'good' : 'tick'); paint(); } };
      el.querySelector('[data-l="reset"]').onclick = () => { k = 0; paint(); };
      paint();
    },
  };
};

/* ---------- a section's step recipe as a track you can tap ---------- */
VIS.recipe = (v) => {
  const g = M.GUIDE && M.GUIDE[v.unit]; if (!g) return { html: '' };
  return {
    html: `<div class="recipe" role="group" aria-label="The steps, in order">${g.recipe.map((r, i) => `<button class="rstep${i === 0 ? ' on' : ''}" data-i="${i}" aria-pressed="${i === 0}"><span class="rn">${i + 1}</span><span class="rt">${UI.esc(r.t)}</span></button>`).join('')}</div>
      <div class="rdesc" aria-live="polite"><b>Step 1:</b> ${R(g.recipe[0].d || g.recipe[0].t)}</div>`,
    mount(el) {
      el.querySelectorAll('.rstep').forEach((b) => (b.onclick = () => {
        const i = +b.dataset.i;
        el.querySelectorAll('.rstep').forEach((x) => { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', String(x === b)); });
        el.querySelector('.rdesc').innerHTML = `<b>Step ${i + 1}:</b> ${R(g.recipe[i].d || g.recipe[i].t)}`;
        UI.Sound.play('tick');
      }));
    },
  };
};
VIS.tri = (v) => ({ html: `<div class="viz">${UI.triangle(v)}</div>` });

/* ==========================================================================
   Plots: improper integrals you can see
   ========================================================================== */
let plotN = 0;
/** o = { f, f2?, x:[x0,x1], y:[y0,y1], shade:[a,b], shadeF?, asym:[c], tail:'right'|'left'|'both', xt:[[v,label]], label, h } */
UI.plot = function (o) {
  const W = 360, H = o.h || 210, ml = 30, mr = 16, mt = 12, mb = 26;
  const [x0, x1] = o.x, [y0, y1] = o.y;
  const X = (x) => ml + ((x - x0) / (x1 - x0)) * (W - ml - mr);
  const Y = (y) => H - mb - ((y - y0) / (y1 - y0)) * (H - mt - mb);
  const asym = o.asym || [];
  const span = y1 - y0;
  const cy = (y) => Math.max(y0 - span * 0.6, Math.min(y1 + span * 0.6, y));
  const near = (x) => asym.some((c) => Math.abs(x - c) < (x1 - x0) * 2e-3);
  const curve = (f) => {
    let d = '', pen = false, xp = null;
    for (let i = 0; i <= 420; i++) {
      const x = x0 + ((x1 - x0) * i) / 420;
      const y = near(x) ? NaN : f(x);
      if (!Number.isFinite(y)) { pen = false; continue; }
      if (pen && asym.some((c) => (xp - c) * (x - c) < 0)) pen = false;
      d += `${pen ? 'L' : 'M'}${X(x).toFixed(1)},${Y(cy(y)).toFixed(1)}`;
      pen = true; xp = x;
    }
    return d;
  };
  const area = (f, a, b) => {
    a = Math.max(a, x0); b = Math.min(b, x1); if (!(b > a)) return '';
    const cuts = [a, ...asym.filter((c) => c > a && c < b), b];
    let out = '';
    for (let k = 0; k < cuts.length - 1; k++) {
      const lo = cuts[k], hi = cuts[k + 1], pts = [];
      for (let i = 0; i <= 160; i++) { const x = lo + ((hi - lo) * i) / 160; if (near(x)) continue; const y = f(x); if (Number.isFinite(y)) pts.push([x, cy(y)]); }
      if (pts.length < 2) continue;
      out += `M${X(pts[0][0]).toFixed(1)},${Y(0).toFixed(1)} ${pts.map(([x, y]) => `L${X(x).toFixed(1)},${Y(y).toFixed(1)}`).join(' ')} L${X(pts[pts.length - 1][0]).toFixed(1)},${Y(0).toFixed(1)} Z `;
    }
    return out;
  };
  const id = 'pc' + ++plotN;
  const axisY = y0 <= 0 && y1 >= 0 ? Y(0) : null, axisX = x0 <= 0 && x1 >= 0 ? X(0) : null;
  const ticks = (o.xt || []).map(([v, lab]) => `<text x="${X(v).toFixed(1)}" y="${H - 8}" text-anchor="middle" font-size="12" fill="var(--ink-2)">${lab}</text><path d="M${X(v).toFixed(1)},${(axisY ?? H - mb) - 4}V${(axisY ?? H - mb) + 4}" stroke="var(--ink-3)" stroke-width="1.2"/>`).join('');
  const tailR = o.tail === 'right' || o.tail === 'both', tailL = o.tail === 'left' || o.tail === 'both';
  return `<svg class="plot" viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="${UI.esc(o.label || 'Graph')}">
    <defs><clipPath id="${id}"><rect x="${ml}" y="${mt}" width="${W - ml - mr}" height="${H - mt - mb}"/></clipPath></defs>
    ${axisY != null ? `<path d="M${ml},${axisY.toFixed(1)}H${W - mr}" stroke="var(--ink-3)" stroke-width="1.3"/>` : ''}
    ${axisX != null ? `<path d="M${axisX.toFixed(1)},${mt}V${H - mb}" stroke="var(--ink-3)" stroke-width="1.3"/>` : ''}
    <g clip-path="url(#${id})">
      ${o.shade ? `<path d="${area(o.shadeF || o.f, o.shade[0], o.shade[1])}" fill="var(--u-hl)" stroke="none"/>` : ''}
      ${o.f2 ? `<path d="${curve(o.f2)}" fill="none" stroke="var(--ink-3)" stroke-width="2" stroke-dasharray="5 5"/>` : ''}
      <path d="${curve(o.f)}" fill="none" stroke="var(--u)" stroke-width="2.8" stroke-linejoin="round"/>
      ${asym.map((c) => `<path d="M${X(c).toFixed(1)},${mt}V${H - mb}" stroke="var(--bad)" stroke-width="2" stroke-dasharray="6 5"/>`).join('')}
      ${o.extra || ''}
    </g>
    ${tailR ? `<text x="${W - mr}" y="${(axisY ?? H - mb) - 8}" text-anchor="end" font-size="13" font-weight="700" fill="var(--u)">→ ∞</text>` : ''}
    ${tailL ? `<text x="${ml + 2}" y="${(axisY ?? H - mb) - 8}" font-size="13" font-weight="700" fill="var(--u)">−∞ ←</text>` : ''}
    ${asym.length ? `<text x="${(X(asym[0]) + 6).toFixed(1)}" y="${mt + 14}" font-size="12" font-weight="600" fill="var(--bad)" stroke="var(--paper-2)" stroke-width="4" stroke-linejoin="round" paint-order="stroke">asymptote</text>` : ''}
    ${ticks}
  </svg>`;
};
/** the picture on step 1 of every improper problem */
UI.impPic = function (p) {
  const c = p.pic; if (!c) return '';
  const xt = [];
  const add = (v) => { if (Number.isFinite(v) && v >= c.x[0] && v <= c.x[1] && !xt.some(([w]) => Math.abs(w - v) < 1e-9)) xt.push([v, (Math.abs(v - Math.E) < 1e-9 ? 'e' : String(Math.round(v * 100) / 100))]); };
  if (p.improper) { [p.improper.lo, p.improper.hi, p.improper.where].forEach((t) => { if (t == null) return; const v = t === 'e' ? Math.E : parseFloat(t); add(v); }); }
  return `<div class="imp-pic">${UI.plot({ f: p.f, x: c.x, y: c.y, shade: [c.from, c.to], asym: c.asym, tail: c.tail, xt, label: 'Graph of the integrand with the region shaded' })}</div>`;
};

/* ---------- 7.8: the two kinds ---------- */
VIS.twoKinds = () => ({
  html: `<div class="viz two-kinds">
    <div><div class="eyebrow">Type 1 · infinite interval</div>${UI.plot({ f: (x) => 1 / (x * x), x: [0, 8], y: [0, 1.5], shade: [1, 8], tail: 'right', xt: [[1, '1']], h: 180, label: 'Area under 1 over x squared from 1 to infinity' })}<div class="tk-cap">${T('\\int_{1}^{\\infty}\\frac{dx}{x^{2}}')}</div></div>
    <div><div class="eyebrow">Type 2 · blows up</div>${UI.plot({ f: (x) => 1 / Math.sqrt(x), x: [-0.12, 1.6], y: [0, 5], shade: [0, 1], asym: [0], xt: [[1, '1']], h: 180, label: 'Area under 1 over root x from 0 to 1' })}<div class="tk-cap">${T('\\int_{0}^{1}\\frac{dx}{\\sqrt{x}}')}</div></div>
  </div>`,
});

/* ---------- 7.8: drag b to ∞ and watch the area ---------- */
VIS.tail = () => {
  const pic = (b, which) => UI.plot({
    f: (x) => 1 / (x * x), f2: (x) => 1 / x, x: [0, 10], y: [0, 1.4], shade: [1, Math.min(b, 10)], shadeF: which === 2 ? (x) => 1 / (x * x) : (x) => 1 / x, tail: b > 10 ? 'right' : null,
    xt: [[1, '1'], ...(b <= 10 ? [[b, 'b']] : [])], h: 200, label: 'Area from 1 to b',
  });
  return {
    html: `<div class="viz tailviz">
      <div class="seg tv-pick" role="group" aria-label="Which area to shade"><button data-w="2" aria-pressed="true">${T('\\frac{1}{x^{2}}')} (solid)</button><button data-w="1" aria-pressed="false">${T('\\frac{1}{x}')} (dashed)</button></div>
      <div class="tv-plot"></div>
      <div class="controls"><span class="eyebrow">b =</span><b class="tnum tv-b">5</b><input type="range" min="0" max="3" step="0.01" value="0.7" aria-label="Move b toward infinity"><span class="eyebrow">→ ∞</span></div>
      <div class="race">
        <div class="lane"><div class="lane-h">${T('\\int_{1}^{b}\\frac{dx}{x^{2}} = 1 - \\frac{1}{b}')} <b class="tnum tv-a2"></b></div><div class="bar"><i class="tv-bar2"></i><span class="lim" style="left:66.6%"></span></div><div class="lane-n good">creeps toward 1, never passes it: <b>converges to 1</b></div></div>
        <div class="lane"><div class="lane-h">${T('\\int_{1}^{b}\\frac{dx}{x} = \\ln b')} <b class="tnum tv-a1"></b></div><div class="bar bad"><i class="tv-bar1"></i></div><div class="lane-n bad">keeps growing forever: <b>diverges</b></div></div>
      </div></div>`,
    mount(el) {
      let which = 2;
      const sl = el.querySelector('input'), box = el.querySelector('.tv-plot');
      const upd = () => {
        const b = 10 ** +sl.value;
        box.innerHTML = pic(b, which);
        el.querySelector('.tv-b').textContent = b < 100 ? b.toFixed(1) : Math.round(b);
        const a2 = 1 - 1 / b, a1 = Math.log(b);
        el.querySelector('.tv-a2').textContent = '= ' + a2.toFixed(3);
        el.querySelector('.tv-a1').textContent = '= ' + a1.toFixed(2);
        el.querySelector('.tv-bar2').style.width = `${(a2 / 1.5) * 100}%`;
        el.querySelector('.tv-bar1').style.width = `${Math.min(100, (a1 / 1.5) * 100)}%`;
        el.querySelector('.tv-bar1').parentElement.classList.toggle('over', a1 > 1.5);
      };
      el.querySelectorAll('[data-w]').forEach((btn) => (btn.onclick = () => { which = +btn.dataset.w; el.querySelectorAll('[data-w]').forEach((x) => x.setAttribute('aria-pressed', String(x === btn))); upd(); }));
      sl.oninput = upd; upd();
    },
  };
};

/* ---------- 7.8: drag t to 0 and watch the area ---------- */
VIS.spike = () => {
  const pic = (t, which) => UI.plot({
    f: (x) => 1 / Math.sqrt(x), f2: (x) => 1 / x, x: [-0.08, 1.25], y: [0, 7], shade: [t, 1], shadeF: which === 2 ? (x) => 1 / Math.sqrt(x) : (x) => 1 / x, asym: [0],
    xt: [[1, '1'], ...(t > 0.06 ? [[t, 't']] : [])], h: 200, label: 'Area from t to 1',
  });
  return {
    html: `<div class="viz tailviz">
      <div class="seg tv-pick" role="group" aria-label="Which area to shade"><button data-w="2" aria-pressed="true">${T('\\frac{1}{\\sqrt{x}}')} (solid)</button><button data-w="1" aria-pressed="false">${T('\\frac{1}{x}')} (dashed)</button></div>
      <div class="tv-plot"></div>
      <div class="controls"><span class="eyebrow">0 ←</span><input type="range" min="-4" max="0" step="0.01" value="-0.5" aria-label="Move t toward 0"><span class="eyebrow">t =</span><b class="tnum tv-b"></b></div>
      <div class="race">
        <div class="lane"><div class="lane-h">${T('\\int_{t}^{1}\\frac{dx}{\\sqrt{x}} = 2 - 2\\sqrt{t}')} <b class="tnum tv-a2"></b></div><div class="bar"><i class="tv-bar2"></i><span class="lim" style="left:66.6%"></span></div><div class="lane-n good">creeps toward 2: <b>converges to 2</b></div></div>
        <div class="lane"><div class="lane-h">${T('\\int_{t}^{1}\\frac{dx}{x} = -\\ln t')} <b class="tnum tv-a1"></b></div><div class="bar bad"><i class="tv-bar1"></i></div><div class="lane-n bad">blows up as t → 0: <b>diverges</b></div></div>
      </div></div>`,
    mount(el) {
      let which = 2;
      const sl = el.querySelector('input'), box = el.querySelector('.tv-plot');
      const upd = () => {
        const t = 10 ** +sl.value;
        box.innerHTML = pic(t, which);
        el.querySelector('.tv-b').textContent = t >= 0.01 ? t.toFixed(3) : t.toExponential(1);
        const a2 = 2 - 2 * Math.sqrt(t), a1 = -Math.log(t);
        el.querySelector('.tv-a2').textContent = '= ' + a2.toFixed(3);
        el.querySelector('.tv-a1').textContent = '= ' + a1.toFixed(2);
        el.querySelector('.tv-bar2').style.width = `${(a2 / 3) * 100}%`;
        el.querySelector('.tv-bar1').style.width = `${Math.min(100, (a1 / 3) * 100)}%`;
        el.querySelector('.tv-bar1').parentElement.classList.toggle('over', a1 > 3);
      };
      el.querySelectorAll('[data-w]').forEach((btn) => (btn.onclick = () => { which = +btn.dataset.w; el.querySelectorAll('[data-w]').forEach((x) => x.setAttribute('aria-pressed', String(x === btn))); upd(); }));
      sl.oninput = upd; upd();
    },
  };
};

/* ---------- 7.8: the interior-asymptote trap from class ---------- */
VIS.splitTrap = () => {
  const f = (x) => 1 / (x * x);
  const pic = UI.plot({ f, x: [-1.4, 2.4], y: [0, 6], shade: [-1, 2], asym: [0], xt: [[-1, '−1'], [2, '2']], h: 210, label: 'Graph of 1 over x squared from negative 1 to 2' });
  const say = [
    ['Plain look', 'The bottom is $x^2$. At $x = 0$ it is 0, and 0 sits INSIDE $[-1, 2]$.', '\\int_{-1}^{2}\\frac{dx}{x^{2}}'],
    ['Blind integration', 'A positive function with a NEGATIVE area? Impossible. Something broke at $x = 0$.', '\\left[-\\frac{1}{x}\\right]_{-1}^{2} = -\\frac{1}{2} - 1 = \\htmlClass{hbad}{-\\frac{3}{2}\\;\\;✗}'],
    ['Split at 0', 'Each piece gets its own one-sided limit.', '\\lim_{t\\to 0^{-}}\\int_{-1}^{t}\\frac{dx}{x^{2}} + \\lim_{s\\to 0^{+}}\\int_{s}^{2}\\frac{dx}{x^{2}}'],
    ['Left piece', 'As $t \\to 0^{-}$, $-\\frac{1}{t}$ is huge and positive.', '\\lim_{t\\to 0^{-}}\\left(-\\frac{1}{t} - 1\\right) = +\\infty \\;\\Rightarrow\\; \\htmlClass{hbad}{\\text{diverges}}'],
  ];
  return {
    html: `<div class="viz">${pic}<div class="st-steps" role="group">${say.map((s, i) => `<button class="chip" data-s="${i}" aria-pressed="${i === 0}">${i + 1}. ${s[0]}</button>`).join('')}</div><div class="st-out"></div></div>`,
    mount(el) {
      const out = el.querySelector('.st-out');
      const show = (i) => {
        el.querySelectorAll('[data-s]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.s === i)));
        out.innerHTML = `<div class="math-lines">${T(say[i][2], true)}</div><p class="muted">${R(say[i][1])}</p>`;
      };
      el.querySelectorAll('[data-s]').forEach((b) => (b.onclick = () => { show(+b.dataset.s); UI.Sound.play('tick'); }));
      show(0);
    },
  };
};

/* ---------- 7.8: the p-test, both directions at once ---------- */
VIS.ptest = () => {
  const panel = (p, kind) => kind === 'inf'
    ? UI.plot({ f: (x) => x ** -p, x: [0, 8], y: [0, 1.6], shade: [1, 8], tail: 'right', xt: [[1, '1']], h: 170, label: 'p-test out to infinity' })
    : UI.plot({ f: (x) => x ** -p, x: [-0.1, 1.5], y: [0, 6], shade: [0, 1], asym: [0], xt: [[1, '1']], h: 170, label: 'p-test near zero' });
  const verdict = (p, kind) => {
    const conv = kind === 'inf' ? p > 1 + 1e-9 : p < 1 - 1e-9;
    const val = kind === 'inf' ? 1 / (p - 1) : 1 / (1 - p);
    return `<div class="verdict ${conv ? 'good' : 'bad'}">${conv ? `converges to ${val.toFixed(2)}` : 'diverges'}<span class="muted">${kind === 'inf' ? (conv ? ' (p > 1)' : ' (p ≤ 1)') : conv ? ' (p < 1)' : ' (p ≥ 1)'}</span></div>`;
  };
  return {
    html: `<div class="viz ptest">
      <div class="controls"><span class="eyebrow">p =</span><b class="tnum pt-p">1.50</b><input type="range" min="0.2" max="3" step="0.05" value="1.5" aria-label="Choose p"></div>
      <div class="pt-grid"><div><div class="eyebrow">${T('\\int_{1}^{\\infty}\\frac{dx}{x^{p}}')} out to ∞</div><div class="pt-a"></div><div class="pt-va"></div></div>
      <div><div class="eyebrow">${T('\\int_{0}^{1}\\frac{dx}{x^{p}}')} near 0</div><div class="pt-b"></div><div class="pt-vb"></div></div></div>
      <p class="muted pt-note"></p></div>`,
    mount(el) {
      const sl = el.querySelector('input');
      const upd = () => {
        const p = +sl.value;
        el.querySelector('.pt-p').textContent = p.toFixed(2);
        el.querySelector('.pt-a').innerHTML = panel(p, 'inf'); el.querySelector('.pt-b').innerHTML = panel(p, 'zero');
        el.querySelector('.pt-va').innerHTML = verdict(p, 'inf'); el.querySelector('.pt-vb').innerHTML = verdict(p, 'zero');
        el.querySelector('.pt-note').textContent = Math.abs(p - 1) < 1e-9 ? 'p = 1 diverges both ways: ln never levels off.' : 'They never both converge. The rule flips between ∞ and 0.';
      };
      sl.oninput = upd; upd();
    },
  };
};
})(typeof globalThis !== 'undefined' ? globalThis : this);
