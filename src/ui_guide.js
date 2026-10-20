/* ==========================================================================
   STUDY GUIDE — a step list for every scenario (7.1–7.4, 7.8), the
   "Which method?" yes/no helper, and the Step list drawer that sits next
   to any practice problem.
   Route: { name: 'guide', unit, sc? } or { name: 'guide', which: true }
   ========================================================================== */
(function (G) {
'use strict';
const M = G.M, UI = G.UI;
const T = UI.tex, R = UI.rich, I = UI.I, esc = UI.esc;
const ACT = UI.ACT, app = UI.app;
const st = () => UI.Store.state;
const ORDER = UI.ORDER;
const GS = (UI.GS = { open: {}, which: [], checks: {}, showEx: false, lastUnit: 'ibp' });
let view = null;

const scOf = (u, key) => (M.GUIDE[u] ? M.GUIDE[u].scenarios.find((s) => s.key === key) || null : null);
const keyOf = (u, s) => `${u}/${s.key}`;
const VIS_NAME = { liate: 'the LIATE ladder', flow: 'which trig move?', triangles: 'the three triangles', templates: 'one template per factor', twoKinds: 'the two kinds' };
const solved = (u, s) => (st().guide && st().guide[keyOf(u, s)]) || { n: 0, ok: 0 };
const mountVis = (host, v) => {
  if (!host || !v || !UI.VIS[v.type]) return;
  const out = UI.VIS[v.type](v);
  host.innerHTML = out.html;
  if (out.mount) out.mount(host);
};
const openN = (u, s) => { const k = keyOf(u, s); if (GS.open[k] == null) GS.open[k] = 1; return Math.max(0, Math.min(s.steps.length, GS.open[k])); };
const tick = () => UI.Sound && UI.Sound.play('tick');

UI.renderGuide = function (v) {
  view = v;
  const r = app.route;
  if (r.which) return renderWhich();
  const u = M.GUIDE[r.unit] ? r.unit : 'ibp';
  GS.lastUnit = u;
  const s = r.sc && scOf(u, r.sc);
  if (s) return renderScenario(u, s);
  return renderSection(u);
};

/* ---------------- section: the recipe + every scenario ---------------- */
function tabsHTML(cur) {
  return `<nav class="g-tabs" aria-label="Sections">${ORDER.map((k) => { const un = M.unit(k); return `<button class="u-${k}" data-act="gUnit" data-u="${k}" aria-current="${k === cur ? 'page' : 'false'}"><span class="gtab-sec">${un.sec}</span><span class="gtab-name">${esc(un.short)}</span></button>`; }).join('')}</nav>`;
}
function renderSection(u) {
  const g = M.GUIDE[u], un = M.unit(u);
  view.innerHTML = `<div class="guide u-${u}">
    <button class="backlink" data-act="home">${I.back} Map</button>
    <header class="g-hero">
      <div class="g-hero-t"><div class="eyebrow">Study guide</div><h1>Step lists for every scenario</h1>
        <p class="muted">Spot the scenario, follow its steps, dodge its trap, then try one yourself.</p></div>
      <button class="which-cta" data-act="whichStart"><span class="wc-ico">${I.sign}</span><span class="wc-txt"><b>Which method?</b><small>Not sure what you are looking at? Answer yes or no.</small></span>${I.next}</button>
    </header>
    ${tabsHTML(u)}
    <section class="card g-sec">
      <div class="eyebrow">${un.sec} · ${esc(un.name)}</div>
      <p class="g-big">${R(g.big)}</p>
      <div class="g-formula">${T(g.formula, true)}</div>
      <div class="g-recipe-h"><h2>${esc(g.checklistName || 'The steps, every time')}</h2><span class="muted">Tap a step</span></div>
      <div id="gRecipe"></div>
      ${g.visual ? `<details class="g-pic"><summary>${I.eye}<span>Picture it: ${esc(VIS_NAME[g.visual.type] || 'the big idea')}</span></summary><div id="gSecVis" class="g-pic-b"></div></details>` : ''}
    </section>
    <div class="g-list-h"><h2>${g.scenarios.length} scenarios</h2><span class="muted">Tap one for its step list</span></div>
    <div class="g-tiles">${g.scenarios.map((s, i) => { const sv = solved(u, s); return `<button class="g-tile" data-act="gOpen" data-u="${u}" data-sc="${s.key}">
      <span class="gti-n">${i + 1}</span>
      <span class="gti-body"><b class="gti-name">${esc(s.name)}</b><span class="gti-pat">${T('\\displaystyle ' + s.pattern)}</span><span class="gti-spot">${R(s.spot)}</span></span>
      <span class="gti-end">${sv.ok ? `<span class="gti-ok" title="Solved ${sv.ok} with full credit from the guide">${I.check}${sv.ok}</span>` : ''}${I.next}</span>
    </button>`; }).join('')}</div>
  </div>`;
  mountVis(document.getElementById('gRecipe'), { type: 'recipe', unit: u });
  if (g.visual) mountVis(document.getElementById('gSecVis'), g.visual);
  // on a phone the tab row scrolls: keep the current section in view
  const tabs = view.querySelector('.g-tabs'), cur = tabs && tabs.querySelector('[aria-current="page"]');
  if (cur) tabs.scrollLeft = Math.max(0, cur.offsetLeft - tabs.offsetLeft - (tabs.clientWidth - cur.offsetWidth) / 2);
}

/* ---------------- one scenario: spot it, the steps, the trap, try one ---------------- */
function stepRows(u, s) {
  const n = openN(u, s);
  return s.steps.map((x, i) => {
    const shown = i < n, cur = i === n - 1;
    const head = shown
      ? `<div class="gstep-h"><span class="gs-n">${i + 1}</span><span class="gs-t">${R(x.t)}</span><button class="icon-btn sm" data-act="gReadStep" data-i="${i}" aria-label="Read step ${i + 1} aloud">${I.speaker}</button></div>`
      : `<button class="gstep-h" data-act="gStep" data-i="${i}"><span class="gs-n">${i + 1}</span><span class="gs-t">${R(x.t)}</span><span class="gs-show">${I.eye}<span>Show</span></span></button>`;
    return `<li class="gstep${shown ? ' shown' : ''}${cur ? ' cur' : ''}" id="gst${i}">${head}${shown ? `<div class="gstep-b">${x.d ? `<p>${R(x.d)}</p>` : ''}<div class="math-lines">${(x.m || []).map((l) => T(l, true)).join('')}</div></div>` : ''}</li>`;
  }).join('');
}
function stepCtl(u, s) {
  const n = openN(u, s), L = s.steps.length;
  return `<div class="gs-prog"><span class="gs-dots" aria-hidden="true">${s.steps.map((_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span><span class="gs-count tnum">${n} of ${L}</span></div>
    <div class="gs-btns">${n < L
      ? `<button class="btn accent" data-act="gNext" title="Next step (N)">${n ? 'Next step' : 'Show step 1'} ${I.next}</button><button class="btn ghost sm" data-act="gAll">Show all</button>`
      : `<button class="btn soft sm" data-act="gHide">${I.eye} Cover the math and quiz myself</button>`}</div>`;
}
function paintSteps(u, s, flashI) {
  const ol = document.getElementById('gSteps'), ctl = document.getElementById('gCtl'); if (!ol || !ctl) return;
  ol.innerHTML = stepRows(u, s); ctl.innerHTML = stepCtl(u, s);
  if (flashI != null) {
    const el = document.getElementById('gst' + flashI);
    if (el) { el.classList.add('flash'); el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  }
}
function renderScenario(u, s) {
  const g = M.GUIDE[u], un = M.unit(u), idx = g.scenarios.indexOf(s);
  const prev = g.scenarios[idx - 1], next = g.scenarios[idx + 1];
  const nextUnit = !next && ORDER[ORDER.indexOf(u) + 1];
  const sv = solved(u, s);
  const locked = UI.isLocked && UI.isLocked(u);
  view.innerHTML = `<div class="guide u-${u}">
    <div class="g-top"><button class="backlink" data-act="gBack">${I.back} ${un.sec} ${esc(un.name)}</button><span class="muted tnum">Scenario ${idx + 1} of ${g.scenarios.length}</span></div>
    <div class="g-title"><h1>${esc(s.name)}</h1><button class="tbtn" data-act="gRead">${I.speaker} Read it</button></div>
    <div class="g-grid">
      <div class="g-main">
        <section class="card g-spot">
          <div class="eyebrow">${I.target} Spot it</div>
          <p>${R(s.spot)}</p>
          <div class="g-pat">${T(s.pattern, true)}</div>
        </section>
        <section class="card g-stepcard" aria-labelledby="gStepsH">
          <div class="g-sc-h"><h2 id="gStepsH">The steps</h2><span class="muted">${s.steps.length} steps</span></div>
          <div class="g-ex"><span class="eyebrow">Worked example</span><div class="g-ex-int">${T(s.example, true)}</div></div>
          <ol class="gsteps" id="gSteps">${stepRows(u, s)}</ol>
          <div class="gs-ctl" id="gCtl">${stepCtl(u, s)}</div>
        </section>
      </div>
      <aside class="g-side">
        ${s.visual ? `<section class="card g-vis"><div class="eyebrow">${I.eye} See it</div><div id="gVis"></div></section>` : ''}
        <section class="card g-trap"><span class="trap-x" aria-hidden="true">✗</span><div><div class="eyebrow">The trap</div><p>${R(s.trap)}</p></div></section>
        ${s.twin ? `<section class="card g-twin"><div class="eyebrow">Same look, different ending</div><div class="g-twin-m">${T(s.twin.tex, true)}</div><p class="muted">${R(s.twin.note)}</p></section>` : ''}
        <section class="card g-try">
          <div><div class="eyebrow">Your turn</div><h3>Try one like this</h3><p class="muted">A fresh problem of this exact type. Every step gets checked, with coaching.${locked ? ` (${un.sec} is still locked on the map, but this works anyway.)` : ''}</p></div>
          <button class="btn accent xl" data-act="gTry" data-u="${u}" data-sc="${s.key}">Try one ${I.play}</button>
          ${sv.n ? `<div class="g-score muted"><b>${sv.ok}</b> full-credit ${sv.ok === 1 ? 'solve' : 'solves'} out of ${sv.n} from here</div>` : ''}
        </section>
      </aside>
    </div>
    <nav class="g-nav" aria-label="Other scenarios">
      ${prev ? `<button class="g-navb" data-act="gOpen" data-u="${u}" data-sc="${prev.key}">${I.back}<span><small>Previous</small>${esc(prev.name)}</span></button>` : '<span></span>'}
      ${next ? `<button class="g-navb nx" data-act="gOpen" data-u="${u}" data-sc="${next.key}"><span><small>Next</small>${esc(next.name)}</span>${I.next}</button>`
        : nextUnit ? `<button class="g-navb nx" data-act="gUnit" data-u="${nextUnit}"><span><small>Next section</small>${M.unit(nextUnit).sec} ${esc(M.unit(nextUnit).name)}</span>${I.next}</button>` : '<span></span>'}
    </nav>
  </div>`;
  if (s.visual) mountVis(document.getElementById('gVis'), s.visual);
}
const curSc = () => { const r = app.route; return r.name === 'guide' && r.sc ? { u: r.unit, s: scOf(r.unit, r.sc) } : null; };
const speakStep = (x) => [UI.speakText(x.t), UI.speakText(x.d), ...(x.m || []).map((l) => M.speak(l))].filter(Boolean).join('. ');

ACT.gUnit = (el) => { const u = el.dataset.u; if (!M.GUIDE[u]) return; UI.go({ name: 'guide', unit: u }); };
ACT.gOpen = (el) => { const u = el.dataset.u, k = el.dataset.sc; if (!scOf(u, k)) return; UI.go({ name: 'guide', unit: u, sc: k }); };
ACT.gBack = () => { const r = app.route; UI.go({ name: 'guide', unit: r.which ? GS.lastUnit : r.unit || GS.lastUnit }); };
ACT.gNext = () => { const c = curSc(); if (!c || !c.s) return; const n = openN(c.u, c.s); if (n >= c.s.steps.length) return; GS.open[keyOf(c.u, c.s)] = n + 1; tick(); paintSteps(c.u, c.s, n); if (st().settings.autoRead) UI.Voice.say(speakStep(c.s.steps[n])); };
ACT.gAll = () => { const c = curSc(); if (!c || !c.s) return; GS.open[keyOf(c.u, c.s)] = c.s.steps.length; tick(); paintSteps(c.u, c.s); };
ACT.gHide = () => { const c = curSc(); if (!c || !c.s) return; GS.open[keyOf(c.u, c.s)] = 0; tick(); paintSteps(c.u, c.s); const h = document.getElementById('gStepsH'); if (h) h.scrollIntoView({ behavior: 'smooth', block: 'start' }); UI.toast(`${I.eye} Say each step out loud, then tap it to check yourself.`, 3200); };
ACT.gStep = (el) => { const c = curSc(); if (!c || !c.s) return; const i = +el.dataset.i; GS.open[keyOf(c.u, c.s)] = Math.max(openN(c.u, c.s), i + 1); tick(); paintSteps(c.u, c.s, i); };
ACT.gReadStep = (el) => { const c = curSc(); if (c && c.s) UI.Voice.say(speakStep(c.s.steps[+el.dataset.i])); };
ACT.gRead = () => {
  const c = curSc(); if (!c || !c.s) return; const s = c.s, n = openN(c.u, s);
  UI.Voice.say([s.name, 'Spot it: ' + UI.speakText(s.spot), 'Example: ' + M.speak(s.example), ...s.steps.map((x, i) => (i < n ? `Step ${i + 1}: ${speakStep(x)}` : `Step ${i + 1}: ${UI.speakText(x.t)}`)), 'The trap: ' + UI.speakText(s.trap)].join('. '));
};
/** "Try one": a fresh problem of this scenario, step by step, even if the section is still locked on the map */
ACT.gTry = (el) => {
  const u = el.dataset.u, k = el.dataset.sc; if (!scOf(u, k) || !UI.newProblem) return;
  UI.newProblem(u, { mode: 'steps', forced: true, guide: { sc: k } });
  UI.go({ name: 'unit', unit: u, tab: 'practice', peek: true });
};
ACT.gReturn = () => { const P = app.P; if (P && P.guide) UI.go({ name: 'guide', unit: P.unit, sc: P.guide.sc }); else UI.go({ name: 'guide', unit: GS.lastUnit }); };

/* ---------------- Which method? one question at a time ---------------- */
function whichWalk() {
  let node = 'start';
  const trail = [];
  for (const a of GS.which) {
    const n = M.WHICH[node]; if (!n) break;
    const to = n.choices ? (n.choices[a] || {}).to : a === 'yes' ? n.yes : n.no;
    trail.push({ node, n, a, label: n.choices ? (n.choices[a] || {}).label : a === 'yes' ? 'Yes' : 'No' });
    node = to;
  }
  return { node, trail };
}
function renderWhich() {
  const { node, trail } = whichWalk();
  const n = M.WHICH[node];
  let card;
  if (n) {
    card = `<section class="card w-q" aria-live="polite">
      <div class="w-qn">Question ${trail.length + 1}</div>
      <h2>${esc(n.q)}</h2>
      ${n.sub ? `<p class="muted">${esc(n.sub)}</p>` : ''}
      ${n.ex ? `<div class="w-ex"><span class="eyebrow">Like these</span><div class="w-ex-row">${n.ex.map((t) => `<span class="w-chip">${T(t)}</span>`).join('')}</div></div>` : ''}
      ${n.choices
        ? `<div class="w-choices">${n.choices.map((c, i) => `<button class="w-choice" data-act="wPick" data-i="${i}"><span class="wc-l">${esc(c.label)}</span>${c.tex ? `<span class="wc-t">${T(c.tex)}</span>` : ''}${I.next}</button>`).join('')}</div>`
        : `<div class="w-yn"><button class="btn xl accent" data-act="wYes">${I.check} Yes</button><button class="btn xl soft" data-act="wNo">${I.x} No</button></div>`}
    </section>`;
  } else if (node && node.startsWith('S:')) {
    const [u, k] = node.slice(2).split('/'); const s = scOf(u, k); const un = M.unit(u);
    card = `<section class="card w-res u-${u}" aria-live="polite">
      <div class="w-badge">${I.check}</div>
      <div class="eyebrow">Your scenario · ${un.sec} ${esc(un.name)}</div>
      <h2>${esc(s.name)}</h2>
      <div class="g-pat">${T(s.pattern, true)}</div>
      <p class="muted">${R(s.spot)}</p>
      <div class="row"><button class="btn accent" data-act="gOpen" data-u="${u}" data-sc="${k}">${I.list} Open its step list</button><button class="btn soft" data-act="gTry" data-u="${u}" data-sc="${k}">Try one ${I.play}</button></div>
    </section>`;
  } else {
    const leaf = M.WHICH_LEAVES[(node || '').slice(2)] || { title: 'Not sure', text: 'Start over and read each question slowly.' };
    card = `<section class="card w-res" aria-live="polite"><div class="w-badge">${I.bulb}</div><div class="eyebrow">Your move</div><h2>${esc(leaf.title)}</h2><p>${R(leaf.text)}</p></section>`;
  }
  view.innerHTML = `<div class="guide which">
    <button class="backlink" data-act="gBack">${I.back} Study guide</button>
    <div class="w-head"><div class="eyebrow">${I.sign} Which method?</div><h1>Find your scenario</h1><p class="muted">Look at your integral and answer one question at a time.</p></div>
    ${trail.length ? `<ol class="w-trail" aria-label="Your answers so far">${trail.map((t) => `<li><span class="wt-q">${esc(t.n.short)}</span><b class="${t.a === 'no' ? 'no' : 'yes'}">${esc(t.label)}</b></li>`).join('')}</ol>` : ''}
    ${card}
    <div class="row w-ctl"><button class="btn ghost sm" data-act="wUndo" ${trail.length ? '' : 'disabled'}>${I.undo} Back one question</button><button class="btn ghost sm" data-act="wReset" ${trail.length ? '' : 'disabled'}>${I.reset} Start over</button></div>
  </div>`;
}
const whichStep = (a) => {
  const { node } = whichWalk(); const n = M.WHICH[node]; if (!n) return;
  if (n.choices ? !n.choices[a] : !(a === 'yes' || a === 'no')) return;
  GS.which.push(a); tick(); UI.render();
  const c = document.querySelector('.w-q, .w-res'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
};
ACT.whichStart = () => { GS.which = []; if (app.route.name === 'guide' && app.route.unit) GS.lastUnit = app.route.unit; UI.go({ name: 'guide', which: true }); };
ACT.wYes = () => whichStep('yes');
ACT.wNo = () => whichStep('no');
ACT.wPick = (el) => whichStep(+el.dataset.i);
ACT.wUndo = () => { if (!GS.which.length) return; GS.which.pop(); tick(); UI.render(); };
ACT.wReset = () => { GS.which = []; tick(); UI.render(); G.scrollTo({ top: 0 }); };

/* keys: N = next step, R = read it; on Which method?: Y / N */
document.addEventListener('keydown', (e) => {
  const r = app.route; if (r.name !== 'guide') return;
  const typing = /INPUT|TEXTAREA|SELECT/.test(e.target.tagName || '') || e.target.isContentEditable;
  if (typing || e.metaKey || e.ctrlKey || e.altKey || document.querySelector('.modal')) return;
  const k = e.key.toLowerCase();
  if (r.which) { if (k === 'y') ACT.wYes(); else if (k === 'n') ACT.wNo(); return; }
  if (r.sc) { if (k === 'n') ACT.gNext(); else if (k === 'r') ACT.gRead(); }
});

/* ---------------- the Step list drawer, next to any practice problem ---------------- */
function paintStepList(el) {
  const cur = UI.currentProblem && UI.currentProblem();
  el.dataset.pid = cur ? cur.p.id || cur.p.tex : '';
  if (!cur) {
    el.innerHTML = `<div class="sl"><p class="muted">Open a practice problem, then tap <b>Step list</b> to see the steps for its scenario.</p><button class="btn soft sm" data-sl="guide">${I.list} Open the study guide</button></div>`;
    return;
  }
  const { unit, p } = cur, un = M.unit(unit);
  const s = M.guideScenario(unit, p);
  if (!s) {
    el.innerHTML = `<div class="sl"><p class="muted">No step list for this one yet.</p><button class="btn soft sm" data-sl="guide">${I.list} Open the study guide</button></div>`;
    return;
  }
  const id = cur.p.id || cur.p.tex;
  const done = GS.checks[id] || [];
  el.innerHTML = `<div class="sl u-${unit}">
    <div class="eyebrow">${un.sec} · ${esc(un.short)} · ${esc(cur.where)}</div>
    <h3 class="sl-name">${esc(s.name)}</h3>
    <div class="sl-pat">${T(s.pattern, true)}</div>
    <p class="sl-tip muted">Work it on paper. Tick each step as you finish it.</p>
    ${GS.showEx ? `<div class="sl-exq"><span class="eyebrow">Worked example</span>${T(s.example, true)}</div>` : ''}
    <ol class="sl-list">${s.steps.map((x, i) => `<li class="${done.includes(i) ? 'done' : ''}">
      <label class="sl-row"><input type="checkbox" data-i="${i}" ${done.includes(i) ? 'checked' : ''}><span class="sl-n">${i + 1}</span><span class="sl-t">${R(GS.showEx ? x.t : x.g || x.t)}</span></label>
      ${GS.showEx ? `<div class="sl-ex">${x.d ? `<p>${R(x.d)}</p>` : ''}<div class="math-lines">${(x.m || []).map((l) => T(l, true)).join('')}</div></div>` : ''}
    </li>`).join('')}</ol>
    ${done.length === s.steps.length ? `<div class="sl-done">${I.check} Every step done. Now check your final answer.</div>` : ''}
    <div class="sl-trap"><span class="trap-x" aria-hidden="true">✗</span><span><b>Trap:</b> ${R(s.trap)}</span></div>
    <div class="row sl-btns">
      <button class="btn sm soft" data-sl="ex" aria-pressed="${GS.showEx}">${I.eye} ${GS.showEx ? 'Hide the worked example' : 'Show a worked example'}</button>
      <button class="btn sm ghost" data-sl="open" data-u="${unit}" data-sc="${s.key}">${I.list} Open in study guide</button>
    </div>
  </div>`;
}
UI.TOOLS.steps = {
  title: 'Step list',
  mount(el) {
    this.el = el; paintStepList(el);
    el.addEventListener('change', (e) => {
      const b = e.target.closest('input[type="checkbox"][data-i]'); if (!b) return;
      const id = el.dataset.pid; if (!id) return;
      const arr = (GS.checks[id] = GS.checks[id] || []); const i = +b.dataset.i;
      if (b.checked) { if (!arr.includes(i)) arr.push(i); } else GS.checks[id] = arr.filter((x) => x !== i);
      UI.Sound.play(b.checked ? 'good' : 'tick'); paintStepList(el);
    });
    el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-sl]'); if (!b) return;
      if (b.dataset.sl === 'ex') { GS.showEx = !GS.showEx; tick(); paintStepList(el); }
      else if (b.dataset.sl === 'open') { UI.closeTool(); UI.go({ name: 'guide', unit: b.dataset.u, sc: b.dataset.sc }); }
      else if (b.dataset.sl === 'guide') { UI.closeTool(); ACT.guide(); }
    });
  },
  onShow() {
    paintStepList(this.el);
    clearInterval(this.poll);
    // a new problem while the list is open (next item, New problem) refreshes it
    this.poll = setInterval(() => { const c = UI.currentProblem && UI.currentProblem(); const id = c ? c.p.id || c.p.tex : ''; if (this.el && id !== this.el.dataset.pid) paintStepList(this.el); }, 700);
  },
  onHide() { clearInterval(this.poll); },
};
})(typeof globalThis !== 'undefined' ? globalThis : this);
