/* ==========================================================================
   TOOLS — calculator, formulas, scratchpad, graph, unit circle, focus timer,
   Ask Claude. Rendered into the shared drawer; DOM is kept between opens.
   ========================================================================== */
(function (G) {
'use strict';
const M = G.M, UI = G.UI;
const T = UI.tex, R = UI.rich, I = UI.I;
const st = () => UI.Store.state;
const TOOLS = (UI.TOOLS = {});
let openName = null;

UI.toggleTool = (name) => (openName === name ? UI.closeTool() : UI.openTool(name));
UI.openTool = function (name) {
  const t = TOOLS[name]; if (!t) return;
  const drawer = document.getElementById('drawer'), body = document.getElementById('drawerBody');
  if (openName && TOOLS[openName].onHide) TOOLS[openName].onHide();
  openName = name;
  document.getElementById('drawerTitle').textContent = t.title;
  if (!t.el) { t.el = document.createElement('div'); t.mount(t.el); }
  body.replaceChildren(t.el);
  drawer.classList.toggle('tall', !!t.tall);
  drawer.classList.add('open'); drawer.setAttribute('aria-hidden', 'false');
  document.getElementById('scrim').classList.add('on');
  document.querySelectorAll('.dock-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.tool === name)));
  t.onShow && t.onShow();
};
UI.closeTool = function () {
  if (!openName) return;
  const t = TOOLS[openName]; t && t.onHide && t.onHide();
  openName = null;
  const drawer = document.getElementById('drawer');
  drawer.classList.remove('open'); drawer.setAttribute('aria-hidden', 'true');
  document.getElementById('scrim').classList.remove('on');
  document.querySelectorAll('.dock-btn').forEach((b) => b.setAttribute('aria-pressed', 'false'));
};

/* ================= CALCULATOR ================= */
TOOLS.calc = {
  title: 'Calculator',
  mount(el) {
    const S = { deg: false, ans: 0, hist: [] };
    el.innerHTML = `<div class="calc-display"><input id="calcIn" type="text" inputmode="text" autocomplete="off" spellcheck="false" placeholder="e.g. (e^2+1)/4" aria-label="Calculator input"><div class="res tnum" id="calcRes">0</div><div class="exact" id="calcEx"></div></div>
      <div class="row between" style="margin-bottom:8px"><div class="seg"><button data-m="rad" aria-pressed="true">RAD</button><button data-m="deg" aria-pressed="false">DEG</button></div><span class="muted" style="font-size:12.5px">Enter = evaluate</span></div>
      <div class="calc-keys">${[
        ['sin', 'f'], ['cos', 'f'], ['tan', 'f'], ['ln', 'f'], ['√', 'f'],
        ['sin⁻¹', 'f'], ['cos⁻¹', 'f'], ['tan⁻¹', 'f'], ['log', 'f'], ['x²', 'f'],
        ['(', 'f'], [')', 'f'], ['^', 'f'], ['π', 'f'], ['e', 'f'],
        ['7'], ['8'], ['9'], ['÷'], ['AC', 'clr'],
        ['4'], ['5'], ['6'], ['×'], ['⌫', 'clr'],
        ['1'], ['2'], ['3'], ['−'], ['ans', 'f'],
        ['0'], ['.'], ['frac', 'f'], ['+'], ['=', 'eq'],
      ].map(([k, c]) => `<button class="${c || ''}" data-k="${k}">${k}</button>`).join('')}</div>
      <div class="hist" id="calcHist"></div>`;
    const inp = el.querySelector('#calcIn'), res = el.querySelector('#calcRes'), ex = el.querySelector('#calcEx'), hist = el.querySelector('#calcHist');
    function evalStr(src) {
      let s = String(src).replace(/\bans\b/gi, `(${S.ans})`).replace(/\blog\s*\(/gi, 'LOGTEN(');
      s = s.replace(/LOGTEN\(/g, '§(');
      // handle log10 by splitting: evaluate inner with recursion
      const tenLog = s.indexOf('§(');
      if (tenLog >= 0) {
        let depth = 0, j = tenLog + 1;
        for (; j < s.length; j++) { if (s[j] === '(') depth++; else if (s[j] === ')') { depth--; if (depth === 0) break; } }
        const inner = evalStr(s.slice(tenLog + 2, j));
        if (!Number.isFinite(inner)) return NaN;
        return evalStr(s.slice(0, tenLog) + `(${Math.log10(inner)})` + s.slice(j + 1));
      }
      const r = M.parse(s, { vars: [] });
      if (!r.ok) { if (r.empty) return null; throw new Error(r.error); }
      let ast = r.ast;
      if (S.deg) ast = degify(ast);
      return M.compile(ast)({});
    }
    function degify(n) {
      if (!n || typeof n !== 'object') return n;
      const c = { ...n }; if (c.a) c.a = degify(c.a); if (c.b) c.b = degify(c.b);
      if (c.type === 'fn' && ['sin', 'cos', 'tan', 'sec', 'csc', 'cot'].includes(c.name)) c.a = { type: 'mul', a: c.a, b: { type: 'num', v: String(Math.PI / 180) } };
      if (c.type === 'fn' && ['asin', 'acos', 'atan'].includes(c.name)) return { type: 'mul', a: c, b: { type: 'num', v: String(180 / Math.PI) } };
      return c;
    }
    const fmt = (v) => (Math.abs(v) < 1e-12 ? '0' : Math.abs(v) >= 1e10 || Math.abs(v) < 1e-6 ? v.toExponential(8) : String(+v.toPrecision(12)));
    function live() {
      try { const v = evalStr(inp.value); if (v == null) { res.textContent = ''; ex.innerHTML = ''; return; } res.textContent = Number.isFinite(v) ? '= ' + fmt(v) : 'undefined'; const rec = Number.isFinite(v) && !S.deg ? M.recognize(v) : null; ex.innerHTML = rec && rec !== fmt(v) ? `exact: ${T(rec)}` : ''; res.style.color = ''; }
      catch (e) { res.textContent = '…'; ex.textContent = e.message; }
    }
    function commit() {
      try {
        const v = evalStr(inp.value); if (v == null || !Number.isFinite(v)) return;
        S.ans = v; S.hist.unshift({ e: inp.value, v }); S.hist = S.hist.slice(0, 12);
        hist.innerHTML = S.hist.map((h, i) => `<button data-h="${i}"><span>${UI.esc(h.e)}</span><b>${fmt(h.v)}</b></button>`).join('');
        inp.value = fmt(v); live(); UI.Sound.play('tick');
      } catch (e) { res.textContent = 'check the expression'; }
    }
    const insert = (txt, back = 0) => { const s = inp.selectionStart ?? inp.value.length, e2 = inp.selectionEnd ?? s; inp.value = inp.value.slice(0, s) + txt + inp.value.slice(e2); const p = s + txt.length - back; inp.setSelectionRange(p, p); live(); };
    inp.addEventListener('input', live);
    inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); commit(); } });
    el.querySelector('.calc-keys').addEventListener('pointerdown', (e) => { if (e.target.closest('button')) e.preventDefault(); });
    el.querySelector('.calc-keys').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return; const k = b.dataset.k;
      const map = { 'sin⁻¹': 'asin(', 'cos⁻¹': 'acos(', 'tan⁻¹': 'atan(', sin: 'sin(', cos: 'cos(', tan: 'tan(', ln: 'ln(', log: 'log(', '√': 'sqrt(', 'x²': '^2', '÷': '/', '×': '*', '−': '-', π: 'pi', ans: 'ans' };
      if (k === 'AC') { inp.value = ''; live(); }
      else if (k === '⌫') { const s = inp.selectionStart ?? inp.value.length; if (s > 0) { inp.value = inp.value.slice(0, s - 1) + inp.value.slice(s); inp.setSelectionRange(s - 1, s - 1); live(); } }
      else if (k === '=') commit();
      else if (k === 'frac') { try { const v = evalStr(inp.value); const rec = M.recognize(v); ex.innerHTML = rec ? `exact: ${T(rec)}` : 'no simple exact form found'; } catch (err) { /* ignore */ } }
      else if (map[k] && map[k].endsWith('(')) insert(map[k] + ')', 1);
      else insert(map[k] || k);
    });
    el.querySelectorAll('[data-m]').forEach((b) => (b.onclick = () => { S.deg = b.dataset.m === 'deg'; el.querySelectorAll('[data-m]').forEach((x) => x.setAttribute('aria-pressed', String(x === b))); live(); }));
    hist.addEventListener('click', (e) => { const b = e.target.closest('[data-h]'); if (b) { inp.value = S.hist[+b.dataset.h].e; live(); } });
  },
  onShow() { const i = this.el.querySelector('#calcIn'); if (!(G.matchMedia && G.matchMedia('(pointer: coarse)').matches)) setTimeout(() => i.focus(), 250); },
};

/* ================= FORMULA SHEET ================= */
const SHEET = {
  'By parts': [
    ['The formula', '\\int u\\,dv = uv - \\int v\\,du'],
    ['Pick u (first on the list)', '\\text{L}\\text{ogs} \\to \\text{I}\\text{nverse trig} \\to \\text{A}\\text{lgebraic} \\to \\text{T}\\text{rig} \\to \\text{E}\\text{xponential}'],
    ['The 4-box', '\\begin{array}{c|c} u & dv \\\\ \\hline du & v \\end{array}\\qquad \\downarrow\\text{diff}\\quad \\downarrow\\text{int}'],
    ['Number next to x', '\\int e^{kx}dx = \\tfrac1k e^{kx},\\quad \\int\\sin kx\\,dx = -\\tfrac1k\\cos kx,\\quad \\int\\cos kx\\,dx = \\tfrac1k\\sin kx'],
    ['Rounds', '\\ln,\\ x: 1 \\qquad x^{2}: 2 \\qquad x^{3}: 3 \\;(\\text{DI table})'],
    ['Boomerang', 'I = \\dots - kI \\;\\Rightarrow\\; (1+k)I = \\dots'],
  ],
  'Trig': [
    ['Pythagorean', '\\sin^{2}x + \\cos^{2}x = 1 \\qquad 1 + \\tan^{2}x = \\sec^{2}x'],
    ['Half-angle', '\\sin^{2}x = \\tfrac{1-\\cos 2x}{2} \\qquad \\cos^{2}x = \\tfrac{1+\\cos 2x}{2}'],
    ['Double angle', '\\sin 2x = 2\\sin x\\cos x \\qquad \\cos 2x = \\cos^{2}x - \\sin^{2}x'],
    ['sin/cos strategy', 'm\\text{ odd: save }\\sin,\\ u=\\cos \\quad n\\text{ odd: save }\\cos,\\ u=\\sin \\quad \\text{even: half-angle}'],
    ['tan/sec strategy', 'n\\text{ even: save }\\sec^{2},\\ u = \\tan \\qquad m\\text{ odd: save }\\sec\\tan,\\ u=\\sec'],
    ['Product to sum', '\\sin A\\cos B = \\tfrac12[\\sin(A-B)+\\sin(A+B)]'],
    ['', '\\sin A\\sin B = \\tfrac12[\\cos(A-B)-\\cos(A+B)]'],
    ['', '\\cos A\\cos B = \\tfrac12[\\cos(A-B)+\\cos(A+B)]'],
    ['Must-knows', '\\int\\tan x\\,dx = \\ln|\\sec x| \\qquad \\int\\sec x\\,dx = \\ln|\\sec x + \\tan x|'],
  ],
  'Trig sub': [
    ['Shape → substitution', '\\sqrt{a^{2}-x^{2}}: x = a\\sin\\theta \\qquad \\sqrt{a^{2}+x^{2}}: x = a\\tan\\theta \\qquad \\sqrt{x^{2}-a^{2}}: x = a\\sec\\theta'],
    ['Radical becomes', 'a\\cos\\theta \\qquad a\\sec\\theta \\qquad a\\tan\\theta'],
    ['dx', 'a\\cos\\theta\\,d\\theta \\qquad a\\sec^{2}\\theta\\,d\\theta \\qquad a\\sec\\theta\\tan\\theta\\,d\\theta'],
    ['Back to x', '\\text{SOH CAH TOA on the triangle (Pythagoras for the 3rd side)}'],
    ['Formulas', '\\int\\frac{dx}{a^{2}+x^{2}} = \\tfrac1a\\arctan\\tfrac xa \\qquad \\int\\frac{dx}{\\sqrt{a^{2}-x^{2}}} = \\arcsin\\tfrac xa'],
  ],
  'Partial fractions': [
    ['The 5 steps (your class checklist)', '\\text{1. Degree check} \\to \\text{2. Factor} \\to \\text{3. Template} \\to \\text{4. Solve } A, B, \\dots \\to \\text{5. Integrate} + C'],
    ['Step 1: degree check', '\\deg(\\text{top}) \\ge \\deg(\\text{bottom}) \\Rightarrow \\text{long divide first}'],
    ['Case 1 and 2: linear', '(x-a): \\tfrac{A}{x-a} \\qquad (x-a)^{2}: \\tfrac{A}{x-a} + \\tfrac{B}{(x-a)^{2}}'],
    ['Case 3 and 4: quadratic', 'x^{2}+k^{2}: \\tfrac{Bx+C}{x^{2}+k^{2}} \\qquad (x^{2}+k^{2})^{2}: \\tfrac{Bx+C}{x^{2}+k^{2}} + \\tfrac{Dx+E}{(x^{2}+k^{2})^{2}}'],
    ['Find constants', '\\text{Heaviside: plug in each root} \\quad \\text{then match coefficients of } x^{2}, x, 1'],
    ['Solve the system', '\\text{Eliminate: add or subtract so a letter cancels} \\quad \\text{Substitute: solve one, plug it in} \\quad \\text{One-letter equation first}'],
    ['Standard forms', '\\int\\frac{dx}{ax+b} = \\frac{1}{a}\\ln|ax+b| \\qquad \\int\\frac{dx}{(ax+b)^{n}} = \\frac{(ax+b)^{-n+1}}{a(-n+1)}'],
    ['', '\\int\\frac{dx}{x^{2}+a^{2}} = \\frac{1}{a}\\arctan\\frac{x}{a} \\qquad \\int\\frac{2x\\,dx}{x^{2}+a^{2}} = \\ln(x^{2}+a^{2})'],
  ],
  'Improper': [
    ['Type 1: an infinite limit', '\\int_{a}^{\\infty} f\\,dx = \\lim_{b\\to\\infty}\\int_{a}^{b} f\\,dx \\qquad \\int_{-\\infty}^{b} f\\,dx = \\lim_{a\\to-\\infty}\\int_{a}^{b} f\\,dx'],
    ['Both ends infinite', '\\int_{-\\infty}^{\\infty} f = \\int_{-\\infty}^{0} f + \\int_{0}^{\\infty} f \\quad (\\text{both must converge})'],
    ['Type 2: blows up at an end', '\\int_{a}^{b} f\\,dx = \\lim_{t\\to a^{+}}\\int_{t}^{b} f\\,dx \\quad \\text{or} \\quad \\lim_{t\\to b^{-}}\\int_{a}^{t} f\\,dx'],
    ['Blows up at c inside', '\\int_{a}^{b} f = \\int_{a}^{c} f + \\int_{c}^{b} f \\quad (\\text{one diverges} \\Rightarrow \\text{all diverges})'],
    ['p-test', '\\int_{1}^{\\infty}\\frac{dx}{x^{p}}: \\text{ converges iff } p > 1 \\qquad \\int_{0}^{1}\\frac{dx}{x^{p}}: \\text{ converges iff } p < 1'],
    ['Limits to know', '\\frac{1}{b} \\to 0 \\quad e^{-b} \\to 0 \\quad \\ln b \\to \\infty \\quad \\arctan b \\to \\frac{\\pi}{2} \\quad \\frac{\\ln b}{b} \\to 0 \\quad t\\ln t \\to 0'],
    ['The answer', '\\lim = L \\Rightarrow \\text{converges to } L \\qquad \\lim = \\pm\\infty \\text{ or DNE} \\Rightarrow \\text{diverges}'],
  ],
  'Basics': [
    ['Power & log', '\\int x^{n}dx = \\tfrac{x^{n+1}}{n+1}\\ (n\\ne-1) \\qquad \\int\\tfrac{dx}{x} = \\ln|x|'],
    ['Exponential', '\\int e^{x}dx = e^{x} \\qquad \\int a^{x}dx = \\tfrac{a^{x}}{\\ln a}'],
    ['Trig', '\\int\\sin x = -\\cos x \\quad \\int\\cos x = \\sin x \\quad \\int\\sec^{2}x = \\tan x'],
    ['', '\\int\\csc^{2}x = -\\cot x \\quad \\int\\sec x\\tan x = \\sec x \\quad \\int\\csc x\\cot x = -\\csc x'],
    ['Derivatives', '(\\tan x)\' = \\sec^{2}x \\quad (\\sec x)\' = \\sec x\\tan x \\quad (\\arctan x)\' = \\tfrac{1}{1+x^{2}} \\quad (\\arcsin x)\' = \\tfrac{1}{\\sqrt{1-x^{2}}}'],
  ],
};
const SHEET_FOR = { ibp: 'By parts', trig: 'Trig', tsub: 'Trig sub', pf: 'Partial fractions', imp: 'Improper' };
TOOLS.formulas = {
  title: 'Formula sheet',
  mount(el) {
    const keys = Object.keys(SHEET);
    const show = (k) => {
      el.querySelector('.fsheet').innerHTML = SHEET[k].map(([l, t]) => `<div class="f">${l ? `<div class="eyebrow">${UI.esc(l)}</div>` : ''}${T(t, true)}</div>`).join('');
      el.querySelectorAll('[data-s]').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.s === k)));
    };
    el.innerHTML = `<div class="fsheet-tabs">${keys.map((k) => `<button data-s="${k}">${k}</button>`).join('')}</div><div class="fsheet"></div>`;
    el.querySelectorAll('[data-s]').forEach((b) => (b.onclick = () => show(b.dataset.s)));
    this.show = show; show(SHEET_FOR[UI.app.route.unit] || keys[0]);
  },
  onShow() { const k = SHEET_FOR[UI.app.route.unit]; if (k && this.show) this.show(k); },
};

/* ================= SCRATCHPAD ================= */
const SP = { strokes: [], color: '--ink', eraser: false };
TOOLS.scratch = {
  title: 'Scratchpad', tall: true,
  mount(el) {
    el.innerHTML = `<div class="row between" style="margin-bottom:10px"><div class="swatches">${['--ink', '--pink', '--lav', '--mint'].map((c, i) => `<button class="sw" data-c="${c}" aria-pressed="${i === 0}" style="background:var(${c})" aria-label="Pen color ${c.slice(2)}"></button>`).join('')}
      <button class="tbtn" data-x="eraser" aria-pressed="false">${I.eraser} Eraser</button></div>
      <div class="row"><button class="icon-btn" data-x="undo" aria-label="Undo">${I.undo}</button><button class="icon-btn" data-x="clear" aria-label="Clear">${I.trash}</button></div></div>
      <div class="scratch-wrap"><canvas aria-label="Scratchpad: draw your work"></canvas></div>
      <div class="row between" style="margin-top:10px"><span class="muted" style="font-size:13px">Write your work with a finger, pen or mouse.</span><button class="btn sm accent" data-x="grade" hidden>${I.sparkle} Grade this with Claude</button></div>`;
    const cv = el.querySelector('canvas'), ctx = cv.getContext('2d');
    let cur = null;
    const size = () => { const dpr = G.devicePixelRatio || 1; const w = cv.clientWidth, h = cv.clientHeight; if (!w) return; cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); ctx.setTransform(dpr, 0, 0, dpr, 0, 0); redraw(); };
    function drawStroke(c2, s, colorOverride) {
      if (s.pts.length < 1) return;
      c2.save();
      c2.globalCompositeOperation = s.er ? 'destination-out' : 'source-over';
      c2.strokeStyle = colorOverride || UI.css(s.c) || '#222'; c2.lineCap = 'round'; c2.lineJoin = 'round';
      for (let i = 1; i < s.pts.length; i++) {
        const [x0, y0, p0] = s.pts[i - 1], [x1, y1, p1] = s.pts[i];
        c2.lineWidth = s.er ? 24 : s.w * (0.55 + 0.9 * ((p0 + p1) / 2));
        c2.beginPath(); c2.moveTo(x0, y0); c2.lineTo(x1, y1); c2.stroke();
      }
      if (s.pts.length === 1) { c2.beginPath(); c2.arc(s.pts[0][0], s.pts[0][1], s.w / 2, 0, 7); c2.fillStyle = c2.strokeStyle; c2.fill(); }
      c2.restore();
    }
    function redraw() { ctx.clearRect(0, 0, cv.width, cv.height); SP.strokes.forEach((s) => drawStroke(ctx, s)); }
    const pos = (e) => { const r = cv.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top, e.pressure && e.pointerType === 'pen' ? e.pressure : 0.5]; };
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); cur = { c: SP.color, w: 3.2, er: SP.eraser, pts: [pos(e)] }; SP.strokes.push(cur); redraw(); });
    cv.addEventListener('pointermove', (e) => { if (!cur) return; const evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]; for (const ev of evs) cur.pts.push(pos(ev)); const n = cur.pts.length; drawStroke(ctx, { ...cur, pts: cur.pts.slice(Math.max(0, n - evs.length - 1)) }); });
    const end = () => { cur = null; };
    cv.addEventListener('pointerup', end); cv.addEventListener('pointercancel', end);
    el.addEventListener('click', (e) => {
      const sw = e.target.closest('[data-c]');
      if (sw) { SP.color = sw.dataset.c; SP.eraser = false; el.querySelectorAll('[data-c]').forEach((b) => b.setAttribute('aria-pressed', String(b === sw))); el.querySelector('[data-x="eraser"]').classList.remove('on'); return; }
      const x = e.target.closest('[data-x]'); if (!x) return;
      if (x.dataset.x === 'eraser') { SP.eraser = !SP.eraser; x.classList.toggle('on', SP.eraser); }
      else if (x.dataset.x === 'undo') { SP.strokes.pop(); redraw(); }
      else if (x.dataset.x === 'clear') { if (x.dataset.sure) { SP.strokes = []; redraw(); delete x.dataset.sure; x.style.color = ''; } else { x.dataset.sure = '1'; x.style.color = 'var(--bad)'; UI.toast('Tap the trash again to clear'); setTimeout(() => { delete x.dataset.sure; x.style.color = ''; }, 2500); } }
      else if (x.dataset.x === 'grade') { exportBlob().then((b) => b && UI.openAsk({ mode: 'grade', image: b })); }
    });
    function exportBlob() {
      return new Promise((res) => {
        if (!SP.strokes.length) { UI.toast('Write something on the scratchpad first.'); return res(null); }
        const w = cv.clientWidth, h = cv.clientHeight; const off = document.createElement('canvas'); off.width = w * 2; off.height = h * 2;
        const c2 = off.getContext('2d'); c2.scale(2, 2); c2.fillStyle = '#ffffff'; c2.fillRect(0, 0, w, h);
        const ink = { '--ink': '#1d1930', '--pink': '#c2185b', '--lav': '#4a32c8', '--mint': '#00796b' };
        SP.strokes.forEach((s) => drawStroke(c2, s, s.er ? '#000' : ink[s.c]));
        off.toBlob((b) => res(b), 'image/png');
      });
    }
    this.size = size; this.gradeBtn = el.querySelector('[data-x="grade"]');
    G.addEventListener('resize', () => { if (openName === 'scratch') size(); });
  },
  onShow() { setTimeout(() => this.size(), 300); this.gradeBtn.hidden = !(UI.askImages); },
};

/* ================= GRAPH ================= */
const GR = { cx: 0, cy: 0, k: 46, series: [], fields: ['', '', ''], showAns: false, ctxP: null };
const GCOL = ['--pink', '--lav', '--mint', '--butter'];
TOOLS.graph = {
  title: 'Graph',
  mount(el) {
    el.innerHTML = `<div class="graph-wrap"><canvas aria-label="Graph"></canvas></div>
      <div class="row between" style="margin-top:8px"><div class="row"><button class="icon-btn" data-g="in" aria-label="Zoom in">${I.plus}</button><button class="icon-btn" data-g="out" aria-label="Zoom out">${I.minus}</button><button class="icon-btn" data-g="home" aria-label="Reset view">${I.home}</button></div><span class="muted" style="font-size:12.5px">drag to pan · pinch or scroll to zoom</span></div>
      <div id="grProb"></div>
      <div class="fn-rows">${[0, 1, 2].map((i) => `<div class="fn-row"><i style="background:var(${GCOL[i]})"></i><input data-f="${i}" placeholder="${['f(x) = x*sin(x)', 'g(x) = ...', 'h(x) = ...'][i]}" autocomplete="off" spellcheck="false" aria-label="Function ${i + 1}"><span class="muted pv" style="font-size:12px;max-width:110px;overflow:hidden;text-overflow:ellipsis"></span></div>`).join('')}</div>`;
    const cv = el.querySelector('canvas'), ctx = cv.getContext('2d');
    const fns = [null, null, null];
    el.querySelectorAll('[data-f]').forEach((inp) => inp.addEventListener('input', () => {
      const i = +inp.dataset.f; const r = M.parse(inp.value, { vars: ['x'] });
      fns[i] = r.ok ? M.fnOf(r.ast) : null; inp.nextElementSibling.textContent = inp.value && !r.ok ? '?' : ''; draw();
    }));
    function draw() {
      const dpr = G.devicePixelRatio || 1; const W = cv.clientWidth, H = cv.clientHeight; if (!W) return;
      if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0); ctx.clearRect(0, 0, W, H);
      const X = (x) => W / 2 + (x - GR.cx) * GR.k, Y = (y) => H / 2 - (y - GR.cy) * GR.k;
      const x0 = GR.cx - W / 2 / GR.k, x1 = GR.cx + W / 2 / GR.k, y0 = GR.cy - H / 2 / GR.k, y1 = GR.cy + H / 2 / GR.k;
      const step = [0.1, 0.2, 0.5, 1, 2, 5, 10, 20, 50].find((s) => s * GR.k >= 34) || 100;
      ctx.lineWidth = 1; ctx.strokeStyle = UI.css('--line'); ctx.fillStyle = UI.css('--ink-3'); ctx.font = '11px Lexend, sans-serif';
      for (let x = Math.ceil(x0 / step) * step; x <= x1; x += step) { ctx.beginPath(); ctx.moveTo(X(x), 0); ctx.lineTo(X(x), H); ctx.stroke(); if (Math.abs(x) > 1e-9) ctx.fillText(+x.toFixed(2), X(x) + 3, Math.min(H - 4, Math.max(12, Y(0) + 13))); }
      for (let y = Math.ceil(y0 / step) * step; y <= y1; y += step) { ctx.beginPath(); ctx.moveTo(0, Y(y)); ctx.lineTo(W, Y(y)); ctx.stroke(); if (Math.abs(y) > 1e-9) ctx.fillText(+y.toFixed(2), Math.min(W - 30, Math.max(3, X(0) + 4)), Y(y) - 3); }
      ctx.strokeStyle = UI.css('--ink-2'); ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(0, Y(0)); ctx.lineTo(W, Y(0)); ctx.moveTo(X(0), 0); ctx.lineTo(X(0), H); ctx.stroke();
      const all = GR.series.filter((s) => s.on).concat(fns.map((f, i) => (f ? { fn: f, color: GCOL[i], w: 2.5 } : null)).filter(Boolean));
      for (const s of all) {
        ctx.strokeStyle = UI.css(s.color); ctx.lineWidth = s.w || 2.5; ctx.setLineDash(s.dash ? [7, 6] : []);
        ctx.beginPath(); let pen = false, py = null;
        for (let px = 0; px <= W; px += 1.5) {
          const x = x0 + px / GR.k; let y; try { y = s.fn(x); } catch (e) { y = NaN; }
          if (!Number.isFinite(y) || Math.abs(y) > 1e6) { pen = false; py = null; continue; }
          const sy = Y(y);
          if (pen && py != null && Math.abs(sy - py) > H * 1.5) pen = false;
          pen ? ctx.lineTo(px, sy) : ctx.moveTo(px, sy); pen = true; py = sy;
        }
        ctx.stroke(); ctx.setLineDash([]);
      }
    }
    // pan & zoom
    const ptrs = new Map(); let pinch = null;
    cv.addEventListener('pointerdown', (e) => { cv.setPointerCapture(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]); if (ptrs.size === 2) { const [a, b] = [...ptrs.values()]; pinch = { d: Math.hypot(a[0] - b[0], a[1] - b[1]), k: GR.k }; } });
    cv.addEventListener('pointermove', (e) => {
      if (!ptrs.has(e.pointerId)) return; const prev = ptrs.get(e.pointerId); ptrs.set(e.pointerId, [e.clientX, e.clientY]);
      if (ptrs.size === 2 && pinch) { const [a, b] = [...ptrs.values()]; GR.k = Math.max(4, Math.min(400, (pinch.k * Math.hypot(a[0] - b[0], a[1] - b[1])) / pinch.d)); }
      else if (ptrs.size === 1) { GR.cx -= (e.clientX - prev[0]) / GR.k; GR.cy += (e.clientY - prev[1]) / GR.k; }
      draw();
    });
    const up = (e) => { ptrs.delete(e.pointerId); if (ptrs.size < 2) pinch = null; };
    cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up);
    cv.addEventListener('wheel', (e) => { e.preventDefault(); GR.k = Math.max(4, Math.min(400, GR.k * (e.deltaY < 0 ? 1.12 : 1 / 1.12))); draw(); }, { passive: false });
    el.querySelector('[data-g="in"]').onclick = () => { GR.k = Math.min(400, GR.k * 1.3); draw(); };
    el.querySelector('[data-g="out"]').onclick = () => { GR.k = Math.max(4, GR.k / 1.3); draw(); };
    el.querySelector('[data-g="home"]').onclick = () => { GR.cx = 0; GR.cy = 0; GR.k = 46; draw(); };
    this.draw = draw; this.el = el;
  },
  onShow() { setTimeout(() => { this.draw(); }, 300); },
};
UI.openGraphForProblem = function (P) {
  if (!P) return;
  const p = P.p;
  GR.series = [];
  GR.series.push({ fn: p.f, color: '--lav', w: 4, on: true, label: 'integrand' });
  let her = null;
  const typed = P.mode === 'test' ? P.testInput || (document.getElementById('mfT-in') || {}).value : (P.steps[p.steps.length - 1] || {}).input;
  const val = p.definite || p.improper;
  if (typed && !val) { const r = M.parse(typed, { vars: ['x'] }); if (r.ok) her = M.fnOf(r.ast); }
  if (her) { GR.series.push({ fn: her, color: '--pink', w: 2, on: true, label: 'your F' }); GR.series.push({ fn: (x) => M.deriv(her, x), color: '--pink', w: 2.5, dash: true, on: true, label: 'slope of your F' }); }
  if (P.done && !val) GR.series.push({ fn: p.answer.f, color: '--mint', w: 2, on: false, label: 'answer F' });
  const [lo, hi] = p.domain; GR.cx = (lo + hi) / 2; GR.k = Math.max(20, Math.min(120, 300 / Math.max(1, hi - lo)));
  const ys = M.points(p.domain, 20, 3).map(p.f).filter(Number.isFinite); GR.cy = ys.length ? ys.reduce((a, b) => a + b, 0) / ys.length : 0;
  UI.openTool('graph');
  const box = TOOLS.graph.el.querySelector('#grProb');
  box.innerHTML = `<div class="legend" style="margin-top:6px">${GR.series.map((s, i) => `<label style="display:inline-flex;gap:6px;align-items:center"><input type="checkbox" data-sr="${i}" ${s.on ? 'checked' : ''}><i style="background:var(${s.color});${s.dash ? 'opacity:.6' : ''}"></i>${s.label}</label>`).join('')}</div>
    <p class="muted" style="font-size:13.5px;margin-top:6px">${her ? 'Visual check: if your antiderivative is right, its slope (dashed pink) lies exactly on the integrand (purple).' : 'Purple is the integrand: the slope of the right answer matches it everywhere. Type an answer, then graph again to compare.'}</p>`;
  box.querySelectorAll('[data-sr]').forEach((c) => (c.onchange = () => { GR.series[+c.dataset.sr].on = c.checked; TOOLS.graph.draw(); }));
  setTimeout(() => TOOLS.graph.draw(), 320);
};

/* ================= UNIT CIRCLE ================= */
const UC = [
  [0, '0', '1', '0', '0'], [30, '\\frac{\\pi}{6}', '\\frac{\\sqrt3}{2}', '\\frac12', '\\frac{\\sqrt3}{3}'], [45, '\\frac{\\pi}{4}', '\\frac{\\sqrt2}{2}', '\\frac{\\sqrt2}{2}', '1'], [60, '\\frac{\\pi}{3}', '\\frac12', '\\frac{\\sqrt3}{2}', '\\sqrt3'],
  [90, '\\frac{\\pi}{2}', '0', '1', '\\text{undef}'], [120, '\\frac{2\\pi}{3}', '-\\frac12', '\\frac{\\sqrt3}{2}', '-\\sqrt3'], [135, '\\frac{3\\pi}{4}', '-\\frac{\\sqrt2}{2}', '\\frac{\\sqrt2}{2}', '-1'], [150, '\\frac{5\\pi}{6}', '-\\frac{\\sqrt3}{2}', '\\frac12', '-\\frac{\\sqrt3}{3}'],
  [180, '\\pi', '-1', '0', '0'], [210, '\\frac{7\\pi}{6}', '-\\frac{\\sqrt3}{2}', '-\\frac12', '\\frac{\\sqrt3}{3}'], [225, '\\frac{5\\pi}{4}', '-\\frac{\\sqrt2}{2}', '-\\frac{\\sqrt2}{2}', '1'], [240, '\\frac{4\\pi}{3}', '-\\frac12', '-\\frac{\\sqrt3}{2}', '\\sqrt3'],
  [270, '\\frac{3\\pi}{2}', '0', '-1', '\\text{undef}'], [300, '\\frac{5\\pi}{3}', '\\frac12', '-\\frac{\\sqrt3}{2}', '-\\sqrt3'], [315, '\\frac{7\\pi}{4}', '\\frac{\\sqrt2}{2}', '-\\frac{\\sqrt2}{2}', '-1'], [330, '\\frac{11\\pi}{6}', '\\frac{\\sqrt3}{2}', '-\\frac12', '-\\frac{\\sqrt3}{3}'],
];
const RADLAB = ['0', 'π/6', 'π/4', 'π/3', 'π/2', '2π/3', '3π/4', '5π/6', 'π', '7π/6', '5π/4', '4π/3', '3π/2', '5π/3', '7π/4', '11π/6'];
TOOLS.circle = {
  title: 'Unit circle',
  mount(el) {
    const cx = 190, cy = 190, r = 128;
    const pts = UC.map((u, i) => { const a = (u[0] * Math.PI) / 180; return { i, x: cx + r * Math.cos(a), y: cy - r * Math.sin(a), lx: cx + (r + 34) * Math.cos(a), ly: cy - (r + 34) * Math.sin(a) }; });
    el.innerHTML = `<div class="uc-wrap"><svg viewBox="0 0 380 380" role="img" aria-label="Unit circle">
      <circle cx="${cx}" cy="${cy}" r="${r}" fill="none" stroke="var(--ink)" stroke-width="2"/>
      <path d="M${cx - r - 20},${cy} H${cx + r + 20} M${cx},${cy - r - 20} V${cy + r + 20}" stroke="var(--ink-3)" stroke-width="1.2"/>
      <line id="ucRay" x1="${cx}" y1="${cy}" x2="${cx + r}" y2="${cy}" stroke="var(--pink)" stroke-width="3" stroke-linecap="round"/>
      <path id="ucCos" d="" stroke="var(--lav)" stroke-width="3"/><path id="ucSin" d="" stroke="var(--mint)" stroke-width="3"/>
      ${pts.map((p) => `<g data-p="${p.i}" style="cursor:pointer"><circle cx="${p.x}" cy="${p.y}" r="13" fill="transparent"/><circle cx="${p.x}" cy="${p.y}" r="5.5" fill="var(--card)" stroke="var(--ink)" stroke-width="2"/><text x="${p.lx}" y="${p.ly + 4}" text-anchor="middle" font-size="12" fill="var(--ink-2)" font-weight="600">${RADLAB[p.i]}</text></g>`).join('')}
    </svg><div class="uc-read" id="ucRead"></div><p class="muted" style="font-size:13px;text-align:center">Tap a point. Coordinates are (cos θ, sin θ).</p></div>`;
    const pick = (i) => {
      const p = pts[i], u = UC[i];
      el.querySelector('#ucRay').setAttribute('x2', p.x); el.querySelector('#ucRay').setAttribute('y2', p.y);
      el.querySelector('#ucCos').setAttribute('d', `M${cx},${cy} H${p.x}`); el.querySelector('#ucSin').setAttribute('d', `M${p.x},${cy} V${p.y}`);
      el.querySelector('#ucRead').innerHTML = T(`\\theta = ${u[1]} = ${u[0]}^{\\circ}`, true) + `<div class="row" style="justify-content:center">${T(`\\htmlClass{hv}{\\cos\\theta = ${u[2]}}`)}${T(`\\htmlClass{hd}{\\sin\\theta = ${u[3]}}`)}${T(`\\tan\\theta = ${u[4]}`)}</div>`;
      UI.Sound.play('tick');
    };
    el.querySelectorAll('[data-p]').forEach((g) => (g.onclick = () => pick(+g.dataset.p)));
    pick(1);
  },
};

/* ================= FOCUS TIMER — time you can see, not a clock you have to watch ================= */
// armed = a sprint or break has been started and not finished or reset (running or paused)
const TM = { mode: 'focus', mins: 15, breakMins: 5, left: 15 * 60, total: 15 * 60, running: false, armed: false, end: 0, iv: 0 };
const fmtT = (s) => `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}`;
UI.Sprint = {
  state: TM, listeners: new Set(),
  on(fn) { this.listeners.add(fn); },
  /** nothing started yet, or the last break finished */
  idle() { return !TM.armed; },
  /** started, then put on hold */
  paused() { return TM.armed && !TM.running; },
  paint() {
    const idle = this.idle(), held = this.paused();
    const chip = document.getElementById('timerChip');
    if (chip) {
      chip.hidden = idle; chip.classList.toggle('brk', TM.mode === 'break'); chip.classList.toggle('paused', held);
      document.getElementById('timerT').textContent = fmtT(TM.left);
      const pp = document.getElementById('timerPP'), k = TM.running ? 'run' : 'hold';
      if (pp && pp.dataset.k !== k) {
        pp.dataset.k = k; pp.innerHTML = TM.running ? I.pause : I.play;
        pp.setAttribute('aria-label', TM.running ? 'Pause the timer' : 'Resume the timer'); pp.title = TM.running ? 'Pause (P)' : 'Resume (P)';
      }
    }
    const rib = document.getElementById('ribbon');
    if (rib) { rib.hidden = idle; rib.classList.toggle('brk', TM.mode === 'break'); rib.classList.toggle('paused', held); rib.firstElementChild.style.width = `${Math.max(0, Math.min(100, (100 * TM.left) / Math.max(1, TM.total)))}%`; }
    this.listeners.forEach((fn) => { try { fn(TM); } catch (e) { /* a view went away */ } });
  },
  tick() {
    TM.left = Math.max(0, Math.round((TM.end - Date.now()) / 1000));
    if (TM.left <= 0) {
      clearInterval(TM.iv); TM.running = false; UI.Sound.play('chime');
      if (TM.mode === 'focus') {
        UI.confetti(60);
        UI.toast(`<span class="big">Sprint done!</span> ${TM.breakMins}-minute break started: stand up, stretch, water.`, 6000, 'timer');
        this.start(TM.breakMins, 'break'); return;
      }
      TM.mode = 'focus'; TM.left = TM.total = TM.mins * 60; TM.armed = false;
      UI.toast('Break over. Ready for one more sprint?', 4500, 'timer');
    }
    this.paint();
  },
  /** start fresh with `mins`, or with no argument resume where it was */
  start(mins, mode = 'focus') {
    UI.Sound.ensure();
    clearInterval(TM.iv);
    if (mins) { TM.mode = mode; if (mode === 'focus') TM.mins = mins; else TM.breakMins = mins; TM.left = TM.total = mins * 60; }
    TM.end = Date.now() + TM.left * 1000; TM.running = true; TM.armed = true;
    TM.iv = setInterval(() => this.tick(), 500);
    this.paint();
  },
  pause() {
    if (!TM.running) return;
    clearInterval(TM.iv); TM.left = Math.max(0, Math.round((TM.end - Date.now()) / 1000)); TM.running = false;
    this.paint();
  },
  toggle() { if (TM.running) this.pause(); else this.start(); },
  reset() { clearInterval(TM.iv); TM.running = false; TM.armed = false; TM.mode = 'focus'; TM.left = TM.total = TM.mins * 60; this.paint(); },
  setMins(m) { TM.mins = m; if (!TM.running) { TM.mode = 'focus'; TM.left = TM.total = m * 60; TM.armed = false; } this.paint(); },
};
TOOLS.timer = {
  title: 'Focus timer',
  mount(el) {
    const R0 = 70, C0 = 2 * Math.PI * R0;
    el.innerHTML = `<div class="timer-face">
        <div class="tring"><svg viewBox="0 0 160 160" aria-hidden="true"><circle cx="80" cy="80" r="${R0}" fill="none" stroke="var(--line)" stroke-width="12"/><circle id="tmArc" cx="80" cy="80" r="${R0}" fill="none" stroke="var(--mint)" stroke-width="12" stroke-linecap="round" stroke-dasharray="${C0}" stroke-dashoffset="0" transform="rotate(-90 80 80)"/></svg>
          <div class="tring-in"><div class="mode" id="tmMode">Focus</div><div class="t tnum" id="tmT">15:00</div></div></div></div>
      <div class="row" style="justify-content:center"><button class="btn accent" id="tmGo">${I.play} Start</button><button class="btn soft" id="tmReset">${I.reset} Reset</button></div>
      <div style="margin-top:16px"><div class="eyebrow" style="text-align:center">Sprint length</div><div class="row" style="justify-content:center;margin-top:8px">${[10, 15, 20, 25].map((m) => `<button class="chip" data-min="${m}">${m} min</button>`).join('')}</div></div>
      <div class="row" style="justify-content:center;margin-top:14px"><button class="chip" data-act="noise" aria-pressed="${UI.Noise.on}">${I.headphones} Focus sound (brown noise)</button></div>
      <p class="muted" style="text-align:center;font-size:13.5px;margin-top:14px">Short sprints, then a ${TM.breakMins}-minute break that starts on its own. A thin bar under the top bar shrinks as time runs out, so you never have to watch the clock.</p>
      <p class="muted" style="text-align:center;font-size:13.5px;margin-top:8px">Need a minute? Tap <span class="ico-i">${I.pause}</span> next to the time at the top (or press P) to pause, and <span class="ico-i">${I.play}</span> to keep going.</p>`;
    const paint = () => {
      el.querySelector('#tmT').textContent = fmtT(TM.left);
      el.querySelector('#tmMode').textContent = TM.mode === 'focus' ? 'Focus' : 'Break time';
      const arc = el.querySelector('#tmArc');
      arc.setAttribute('stroke-dashoffset', String(C0 * (1 - TM.left / Math.max(1, TM.total))));
      arc.setAttribute('stroke', TM.mode === 'break' ? 'var(--butter)' : 'var(--mint)');
      el.querySelector('#tmGo').innerHTML = TM.running ? `${I.pause} Pause` : `${I.play} ${UI.Sprint.idle() ? 'Start' : 'Resume'}`;
      el.querySelectorAll('[data-min]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.min === TM.mins)));
    };
    UI.Sprint.on(paint);
    el.querySelector('#tmGo').onclick = () => UI.Sprint.toggle();
    el.querySelector('#tmReset').onclick = () => UI.Sprint.reset();
    el.querySelectorAll('[data-min]').forEach((b) => (b.onclick = () => UI.Sprint.setMins(+b.dataset.min)));
    paint();
  },
};

/* ================= ASK CLAUDE ================= */
const ASK = { sample: null, limits: null, threads: {}, mode: 'chat', busy: false, ctl: null, image: null, stepFocus: null, grade: null };
UI.askAvailable = false; UI.askImages = false;
/** one conversation per problem, so questions about problem 2 never mix with problem 3 */
const ctxKey = (c) => (c && c.key) || 'general';
const turnsFor = (c) => (ASK.threads[ctxKey(c)] = ASK.threads[ctxKey(c)] || []);
const RULES = (c) => `You are a sharp, warm Calculus 2 tutor inside a practice app called Calc 2 Playground. The student is mastering Calc 2 sections 7.1 to 7.4 and 7.8 (integration by parts, trig integrals, trig substitution, partial fractions, improper integrals) for an upcoming test and wants an A+. Their class does partial fractions with a Master 5-Step Checklist: 1 degree check (long divide if top degree ≥ bottom), 2 factor the bottom, 3 write the template, 4 solve for the constants (Heaviside cover-up, then matching coefficients), 5 integrate each piece + C. For improper integrals, always rewrite with a limit, split at every trouble spot, and end with "converges to L" or "diverges".
How to answer:
- Bite-sized: under 120 words unless they ask for more. One idea at a time.
- When you use a formula, write it fully plugged in first, then simplify.
- Use LaTeX: $...$ inline and $$...$$ for display.
- Be encouraging and honest. If there is a mistake, name exactly which step and why.
- If they are mid-problem, coach the next move or ask a guiding question. Give the final answer only if they ask for it.
- Short paragraphs or a short list. No headings.
${ctxBlock(c)}`;
function ctxBlock(c) {
  if (!c) return 'Right now the student is not on a specific practice problem.';
  const focus = ASK.stepFocus != null ? ASK.stepFocus : c.current;
  let status;
  if (c.quiz) status = 'The student is working this problem inside a quiz set that is graded only at the end. Do not say whether their attempt is right or wrong and do not give the final answer unless they explicitly ask for it; coach the method with a guiding question or a hint instead.';
  else if (c.graded) status = `The student finished a quiz set and this problem has been graded ${c.score}/${c.gOutOf}.${c.diagnosis ? ` The grader's note on what went wrong: ${c.diagnosis}` : ''}${c.notes ? ` Grading notes: ${c.notes}` : ''} They can see the answer key now, so explain freely and pinpoint exactly where their answer went off track.`;
  else if (focus != null) status = `The student is on step ${focus + 1}: ${c.p.steps[focus] ? c.p.steps[focus].title : ''}.`;
  else status = 'The student has finished this problem.';
  return `Current problem (${c.unit}): $${c.tex}$
Correct final answer: $${c.answer}$
Worked solution (LaTeX):
${c.steps}
${status}${c.peeked ? `\nThey are following along with the worked solution and have revealed steps 1 to ${c.peeked}. If they ask about a step, explain that step in more detail than the solution does.` : ''}${c.attempt ? `\nTheir typed answer: ${c.attempt}` : c.graded ? '\nThey left it blank.' : ''}`;
}
function chipsFor(c) {
  if (!c) return ['When do I use parts vs u-sub?', 'How do I pick a trig sub?', 'When does an improper integral converge?', 'Quiz me on one problem'];
  if (c.quiz && c.peeked) return [`Explain step ${c.peeked} more simply`, `Why does step ${c.peeked} work?`, 'What comes next?', 'What trap should I watch for?'];
  if (c.quiz) return ['How do I start this one?', 'Which technique fits?', 'Hint, not the answer', 'What trap should I watch for?'];
  if (c.graded) return ['Why is this the answer?', 'Where exactly did I go wrong?', 'Explain the tricky step', 'Give me a similar one to try'];
  if (c.current != null || ASK.stepFocus != null) return ['Explain this step simply', 'Why this choice?', 'Hint, not the answer', 'What is the trap here?'];
  return ['Why is this the answer?', 'Explain the tricky step', 'What is the trap here?', 'Give me a similar one to try'];
}
function introFor(c) {
  if (!c) return 'Ask anything: when to use which technique, what a symbol means, or for a practice problem.';
  if (c.quiz) return 'Ask anything about this problem. Claude coaches you without giving away the answer (unless you ask for it), so your quiz still counts.';
  if (c.graded) return 'Ask why the answer is what it is, or where your work went off track. Claude can see your answer and your grade.';
  return 'Ask anything: why a step works, what a symbol means, or for a nudge without spoilers. Claude can see the problem you are on.';
}
function errCopy(e) {
  const c = e && e.code;
  if (['not_granted', 'sampling_disabled', 'not_declared', 'capability_disabled', 'capability_removed'].includes(c)) { UI.askAvailable = false; return 'Claude is not available in this view.'; }
  if (c === 'rate_limited') return 'Too many questions too fast (or you hit a usage limit). Give it a minute.';
  if (c === 'session_expired') return 'Your session expired. Sign in again to keep asking.';
  if (c === 'image_rejected') return 'That image did not work. Try a clearer photo (JPEG or PNG).';
  if (c === 'images_unavailable') { UI.askImages = false; return 'Photos are not available here. Type your work instead.'; }
  if (c === 'invalid_json') return 'The grade came back garbled. Tap Grade again.';
  if (c === 'refused') return 'Claude could not help with that one. Try rephrasing.';
  if (c === 'cancelled') return '';
  return 'Something went wrong talking to Claude. Try again.';
}
TOOLS.ask = {
  title: 'Ask Claude', tall: true,
  mount(el) { this.el = el; paintAsk(); },
  onShow() { paintAsk(); },
};
UI.askThreads = () => ASK.threads; // for tests
function paintAsk() {
  const el = TOOLS.ask.el; if (!el) return;
  if (!ASK.sample) { paintAskElsewhere(el); return; }
  const c = UI.problemContext && UI.problemContext();
  el.innerHTML = `<div class="seg" style="margin-bottom:12px"><button data-am="chat" aria-pressed="${ASK.mode === 'chat'}">Ask a question</button><button data-am="grade" aria-pressed="${ASK.mode === 'grade'}">Grade my work</button></div>
    ${c ? `<div class="preview" style="margin-bottom:10px"><span class="lbl">about</span>${T(c.tex)}${ASK.stepFocus != null ? `<span class="muted" style="font-size:13px">· step ${ASK.stepFocus + 1}</span>` : c.label ? `<span class="muted" style="font-size:13px;white-space:nowrap">· ${UI.esc(c.label)}</span>` : ''}</div>` : ''}
    <div id="askBody"></div>`;
  el.querySelectorAll('[data-am]').forEach((b) => (b.onclick = () => { ASK.mode = b.dataset.am; paintAsk(); }));
  const body = el.querySelector('#askBody');
  if (ASK.mode === 'chat') paintChat(body, c); else paintGrade(body, c);
}
/* Outside Claude (the copy on your phone, or offline) there is no Claude to ask from inside the page,
   so hand the problem over instead: copy it, paste it into a chat with Claude. */
UI.CLAUDE_URL = (G.CALC2_WEB && G.CALC2_WEB.claudeUrl) || '';
function askText(c) {
  const lines = [`I'm practicing Calc 2 (${c.unit}). Here is the problem, in LaTeX:`, c.tex];
  if (c.attempt && String(c.attempt).trim()) lines.push(`My answer so far: ${String(c.attempt).trim()}`);
  if (c.graded) lines.push(`It was graded ${c.score}/${c.gOutOf}.`);
  if (c.stepTitle && c.current != null) lines.push(`I'm on step ${c.current + 1}: ${c.stepTitle}.`);
  lines.push(c.graded ? 'Where did my work go off track?' : 'Can you help me with the next step without giving away the final answer?');
  return lines.join('\n');
}
function copyText(t) {
  const fallback = () => { const ta = document.createElement('textarea'); ta.value = t; ta.setAttribute('readonly', ''); ta.style.position = 'fixed'; ta.style.opacity = '0'; document.body.appendChild(ta); ta.select(); let ok = false; try { ok = document.execCommand('copy'); } catch (e) { ok = false; } ta.remove(); return ok; };
  if (navigator.clipboard && navigator.clipboard.writeText) return navigator.clipboard.writeText(t).then(() => true, () => fallback());
  return Promise.resolve(fallback());
}
function paintAskElsewhere(el) {
  const c = UI.problemContext && UI.problemContext();
  el.innerHTML = `<div class="unavail">Ask Claude works when this page is open inside Claude. Here, copy the problem (and your work so far), then paste it into a chat with Claude.</div>
    ${c ? `<div class="preview" style="margin:12px 0 10px"><span class="lbl">problem</span>${T(c.tex)}</div><button class="btn accent" id="askCopy" style="width:100%">${I.ask} Copy this problem for Claude</button>` : '<p class="muted" style="font-size:14px;margin-top:10px">Open a practice problem first, then come back here to copy it.</p>'}
    ${UI.CLAUDE_URL ? `<a class="btn soft" href="${UI.esc(UI.CLAUDE_URL)}" target="_blank" rel="noopener" style="width:100%;margin-top:8px;text-decoration:none">Open the Claude version</a>` : ''}`;
  const b = el.querySelector('#askCopy');
  if (b && c) b.onclick = () => copyText(askText(c)).then((ok) => UI.toast(ok ? `${I.check} Copied. Paste it into a chat with Claude.` : 'Could not copy here. Long-press the problem to copy it instead.', 3200));
}
function paintChat(body, c) {
  const turns = turnsFor(c);
  body.innerHTML = `<div class="chat" id="chatLog">${turns.length ? turns.map((t) => `<div class="msg ${t.role === 'user' ? 'me' : 'ai'}">${t.role === 'user' ? UI.esc(t.content) : UI.md(t.content)}</div>`).join('') : `<p class="muted" style="font-size:14px">${introFor(c)}</p>`}</div>
    <div class="chips" style="margin-top:10px">${chipsFor(c).map((q) => `<button data-q="${UI.esc(q)}">${UI.esc(q)}</button>`).join('')}</div>
    <div class="chat-in"><textarea id="askIn" placeholder="${c ? 'Ask about this problem…' : 'Type your question…'}" aria-label="Your question"></textarea><button class="btn accent" id="askSend" aria-label="${ASK.busy ? 'Stop' : 'Send'}">${ASK.busy ? I.stop : I.send}</button></div>
    ${turns.length ? '<button class="btn ghost sm" id="askClear" style="margin-top:6px">New conversation</button>' : ''}`;
  body.querySelectorAll('[data-q]').forEach((b) => (b.onclick = () => sendChat(b.dataset.q)));
  const ta = body.querySelector('#askIn');
  ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendChat(ta.value); } });
  body.querySelector('#askSend').onclick = () => (ASK.busy ? ASK.ctl && ASK.ctl.abort() : sendChat(ta.value));
  const cl = body.querySelector('#askClear'); if (cl) cl.onclick = () => { ASK.threads[ctxKey(c)] = []; paintAsk(); };
  const log = body.querySelector('#chatLog'); log.lastElementChild && log.lastElementChild.scrollIntoView({ block: 'nearest' });
}
async function sendChat(text) {
  text = String(text || '').trim(); if (!text || ASK.busy) return;
  const c = UI.problemContext && UI.problemContext();
  const thread = turnsFor(c); // the reply lands in this problem's thread even if you move on
  thread.push({ role: 'user', content: text });
  ASK.busy = true; paintAsk();
  const log = document.getElementById('chatLog');
  const bubble = document.createElement('div'); bubble.className = 'msg ai'; bubble.innerHTML = '<span class="thinking"><i></i><i></i><i></i> thinking</span>';
  if (log) { log.appendChild(bubble); bubble.scrollIntoView({ block: 'nearest' }); }
  ASK.ctl = new AbortController();
  try {
    const { text: out } = await ASK.sample([{ role: 'user', content: RULES(c) }, ...thread.slice(-12)], { cache: false, signal: ASK.ctl.signal, onText: ({ text: t }) => { bubble.innerHTML = UI.md(t); } });
    thread.push({ role: 'assistant', content: out });
  } catch (e) {
    const msg = errCopy(e);
    if (e && e.text) thread.push({ role: 'assistant', content: e.text + (msg ? `\n\n*${msg}*` : '') });
    else if (msg) thread.push({ role: 'assistant', content: `*${msg}*` });
    else thread.pop();
  }
  ASK.busy = false; ASK.ctl = null; paintAsk();
}
function paintGrade(body, c) {
  if (!c) { body.innerHTML = '<div class="unavail">Open a practice problem first, work it on paper or the scratchpad, then come back here to get it graded.</div>'; return; }
  const g = ASK.grade;
  body.innerHTML = `<div class="stack">
    <div class="field"><label for="gradeIn">Type your work, one line per step</label><textarea id="gradeIn" rows="5" placeholder="u = x, dv = e^(2x) dx&#10;du = dx, v = e^(2x)/2&#10;= (x/2)e^(2x) - ∫ e^(2x)/2 dx&#10;..."></textarea></div>
    ${UI.askImages ? `<div class="row"><label class="btn sm soft" style="cursor:pointer">${I.camera} Photo of my paper<input type="file" id="gradeFile" accept="${(ASK.limits && ASK.limits.images && ASK.limits.images.mediaTypes.join(',')) || 'image/*'}" hidden></label><button class="btn sm soft" id="gradeScratch">${I.pencil} Use my scratchpad</button>${ASK.image ? `<span class="chip">${I.check} image attached <button class="icon-btn" id="gradeNoImg" aria-label="Remove image" style="width:24px;height:24px">${I.x}</button></span>` : ''}</div>` : ''}
    <button class="btn accent" id="gradeGo" ${ASK.busy ? 'disabled' : ''}>${ASK.busy ? '<span class="thinking"><i></i><i></i><i></i> grading</span>' : `${I.sparkle} Grade it like a professor`}</button>
    <div id="gradeOut">${g ? gradeHTML(g) : ''}</div></div>`;
  const ta = body.querySelector('#gradeIn'); ta.value = ASK.typed || ''; ta.oninput = () => { ASK.typed = ta.value; };
  const f = body.querySelector('#gradeFile'); if (f) f.onchange = () => { if (f.files && f.files[0]) { ASK.image = f.files[0]; paintAsk(); } };
  const sc = body.querySelector('#gradeScratch'); if (sc) sc.onclick = () => UI.openTool('scratch');
  const ni = body.querySelector('#gradeNoImg'); if (ni) ni.onclick = () => { ASK.image = null; paintAsk(); };
  body.querySelector('#gradeGo').onclick = () => runGrade();
}
function gradeHTML(g) {
  if (g.error) return `<div class="feedback bad"><span class="mark">!</span><span>${UI.esc(g.error)}</span></div>`;
  const f = g.outOf ? g.score / g.outOf : 0;
  const icon = (s) => (s === 'correct' ? ['✓', 'ok'] : s === 'partial' ? ['~', 'no'] : ['✗', 'no']);
  return `<div class="result" style="padding:16px"><div class="result-top"><div class="stamp ${f >= 0.9 ? 'good' : f >= 0.6 ? 'mid' : 'bad'}" style="width:88px;height:88px"><div><div class="big" style="font-size:28px">${g.score}/${g.outOf}</div><div class="small">${UI.letter(f)}</div></div></div><div><h2 style="font-size:20px">${R(String(g.headline || ''), false)}</h2></div></div>
    ${g.readable === false ? '' : `<div class="notes">${(g.lines || []).map((l) => { const [m, cls] = icon(l.status); return `<div class="note ${cls}"><span class="m">${m}</span><span>${l.work ? T(String(l.work), false, false) + ' — ' : ''}${R(String(l.note || ''), false)}</span></div>`; }).join('')}</div>`}
    ${g.firstError ? `<div class="diag"><div class="t">Where it went wrong</div><div>${R(String(g.firstError), false)}</div>${g.patch ? `<div><b>Patch:</b> ${R(String(g.patch), false)}</div>` : ''}</div>` : g.patch ? `<div class="feedback info"><span class="mark">•</span><span>${R(String(g.patch), false)}</span></div>` : ''}</div>`;
}
async function runGrade() {
  const c = UI.problemContext && UI.problemContext(); if (!c || ASK.busy) return;
  const typed = (ASK.typed || '').trim();
  if (!typed && !ASK.image) { UI.toast('Type your work or attach a photo first.'); return; }
  ASK.busy = true; ASK.grade = null; paintAsk();
  const prompt = `Grade this Calculus 2 work like a strict-but-fair professor who gives partial credit, the way a great tutor grades: check every line, accept any equivalent form (antiderivatives may differ by a constant), deduct 1 point for a missing +C on an indefinite integral, deduct 1 for missing absolute value bars inside ln when they are needed, and find the FIRST line where an error appears. If an image is attached it shows the student's handwritten work; if it is unreadable set "readable" to false and say so in the headline.

PROBLEM: $${c.tex}$
TECHNIQUE: ${c.unit}
ANSWER KEY (worked steps, LaTeX):
${c.steps}
Correct final answer: $${c.answer}$
POINTS: out of ${c.outOf}.

STUDENT WORK:
${typed || '(see the attached image)'}

Reply with ONLY a JSON object, like:
{"score": 10, "outOf": ${c.outOf}, "headline": "short verdict", "lines": [{"work": "the student's line in LaTeX", "status": "correct", "note": "under 20 words"}], "firstError": "which step went wrong and why, or null", "trap": "one of ${Object.keys(M.TRAPS).join(', ')}, or null", "patch": "one sentence on how to fix it", "readable": true}
status is one of correct, partial, error. Put math inside strings as $...$ LaTeX.`;
  ASK.ctl = new AbortController();
  try {
    const opts = { signal: ASK.ctl.signal };
    if (ASK.image && UI.askImages) opts.images = [ASK.image];
    const g = await ASK.sample.json(prompt, opts);
    if (!g || typeof g !== 'object') throw { code: 'invalid_json' };
    g.score = Math.max(0, Math.min(+g.outOf || c.outOf, +g.score || 0)); g.outOf = +g.outOf || c.outOf;
    ASK.grade = g;
    if (g.trap && M.TRAPS[g.trap]) { const s = st(); s.traps[g.trap] = (s.traps[g.trap] || 0) + 1; UI.Store.save(); }
    UI.Sound.play(g.score === g.outOf ? 'good' : 'tick');
  } catch (e) { const m = errCopy(e); if (m) ASK.grade = { error: m }; }
  ASK.busy = false; ASK.ctl = null; paintAsk();
}
UI.openAsk = function ({ mode = 'chat', step = null, image = null } = {}) {
  ASK.mode = mode; ASK.stepFocus = step;
  if (image) ASK.image = image;
  UI.openTool('ask');
  const ta = document.getElementById('askIn'); if (!ta || mode !== 'chat') return;
  if (step != null) ta.placeholder = `Ask about step ${step + 1}…`;
  if (!(G.matchMedia && G.matchMedia('(pointer: coarse)').matches)) setTimeout(() => ta.focus({ preventScroll: true }), 300);
};

UI.initTools = function () {
  const C = G.claude;
  if (C && typeof C.use === 'function') {
    C.use('sample').then((s) => {
      if (!s) return;
      ASK.sample = s; UI.askAvailable = true;
      s.limits().then((l) => { ASK.limits = l; UI.askImages = !!(l && l.images); }).catch(() => {});
      const r = UI.app.route; // show "I have a question" on an open step-by-step problem (quiz sets always show Ask)
      if (r.name === 'unit' && r.tab === 'practice' && UI.practiceMode && UI.practiceMode(r.unit) === 'steps' && UI.app.P && !UI.app.P.done) UI.render();
    }).catch(() => {});
  }
};
})(typeof globalThis !== 'undefined' ? globalThis : this);
