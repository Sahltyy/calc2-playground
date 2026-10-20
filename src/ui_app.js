/* ==========================================================================
   APP — routes, views, practice engine, quizzes, games
   ========================================================================== */
(function (G) {
'use strict';
const M = G.M, UI = G.UI;
const T = UI.tex, R = UI.rich, I = UI.I, Store = UI.Store;
const st = () => Store.state;
const ORDER = ['ibp', 'trig', 'tsub', 'pf', 'imp'];
const app = (UI.app = { route: { name: 'home' }, P: null, Q: null, L: {}, MG: null, TS: null, SET: {}, count: 0 });
let view;
const ACT = (UI.ACT = {});
UI.ORDER = ORDER;
/* answers that are a value (definite, improper) instead of an antiderivative */
const isValue = (p) => !!(p && (p.definite || p.improper));
const answerTex = (p) => (p.improper ? (p.improper.converges ? p.improper.exact : '\\text{Diverges}') : p.definite ? p.definite.exact : p.answer.tex + ' + C');
UI.answerTex = answerTex;
/** what a typed answer reads as, for previews and the review list */
function readTyped(p, s) {
  if (p.improper) {
    const r = M.readImproper(s);
    if (r.kind === 'empty') return { ok: false, empty: true };
    if (r.kind === 'invalid') return { ok: false, error: r.msg };
    return { ok: true, tex: r.tex };
  }
  return M.parse(s, { vars: isValue(p) ? [] : ['x'] });
}
/** the answer box for a problem */
const fieldOpts = (p, extra = {}) => (p.improper
  ? { vars: [], pre: '=', improper: true, placeholder: 'Exact value, or type diverges', ...extra }
  : p.definite ? { vars: [], pre: '=', placeholder: 'Exact value, like pi/2 - 1', ...extra } : { vars: ['x'], placeholder: 'Your answer (+ C)', ...extra });

/* ================= helpers ================= */
const isLocked = (k) => { const i = ORDER.indexOf(k); if (i <= 0 || st().settings.unlockAll) return false; return !st().units[ORDER[i - 1]].quizPassed; };
const testLocked = () => !(st().settings.unlockAll || ORDER.every((k) => st().units[k].quizPassed));
const levelFor = (k) => { const u = st().units[k]; if (u.levelPin) return u.levelPin; return u.mastery < 35 ? 1 : u.mastery < 70 ? 2 : 3; };
const currentUnit = () => M.unit(ORDER.find((k) => !st().units[k].quizPassed && !isLocked(k)) || 'imp');
UI.currentUnit = currentUnit;
UI.isLocked = isLocked;
function go(route) {
  if (app.MG && app.MG.timer) { clearInterval(app.MG.timer); app.MG.timer = null; }
  app.route = route; UI.Voice.stop();
  try { sessionStorage.setItem('c2pg.route', JSON.stringify(route)); } catch (e) { /* ignore */ }
  render(); G.scrollTo({ top: 0, behavior: 'instant' in document.documentElement.style ? 'instant' : 'auto' });
}
UI.go = go;
function header() {
  const s = st();
  const sn = document.getElementById('streakN'); if (sn) sn.textContent = UI.streakDays();
  const xn = document.getElementById('xpN'); if (xn) xn.textContent = s.xp;
}
function markDay() { const d = UI.today(); const s = st(); if (!s.days.includes(d)) { s.days.push(d); if (s.days.length > 120) s.days = s.days.slice(-120); } }

/* ================= shell ================= */
UI.boot = function () {
  Store.load();
  UI.hostTheme = document.documentElement.getAttribute('data-theme');
  UI.applyTheme();
  UI.Voice.init();
  const root = document.getElementById('app');
  root.innerHTML = `
  <header class="topbar">
    <button class="brand" data-act="home" aria-label="Calc 2 Playground home"><span class="brand-mark"><svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" aria-hidden="true"><path d="M16.5 3.6c-1.1-1.3-4.4-1.2-4.6 2.6l-.1 11.6c-.2 3.8-3.5 3.9-4.6 2.6"/></svg></span><span class="brand-name">Calc 2 <i>Playground</i></span></button>
    <span class="spacer"></span>
    <span class="chip fire" title="Days in a row">${I.flame}<b id="streakN" class="tnum">0</b></span>
    <button class="chip xp" data-act="rank" title="Your rank">${I.bolt}<b id="xpN" class="tnum">0</b><span class="xp-l">XP</span></button>
    <span class="tchip" id="timerChip" hidden><button class="tchip-pp" id="timerPP" data-act="sprintPP" data-k="run" aria-label="Pause the timer" title="Pause (P)">${I.pause}</button><button class="tchip-t" data-tool="timer" aria-label="Focus timer settings" title="Timer settings"><b id="timerT" class="tnum"></b></button></span>
    <button class="icon-btn" data-act="settings" aria-label="Settings">${I.gear}</button>
    <div class="ribbon" id="ribbon" hidden aria-hidden="true"><i></i></div>
  </header>
  <main class="view" id="view"></main>
  <nav class="dock" aria-label="Tools">
    ${[['calc', 'Calculator', I.calc], ['formulas', 'Formulas', I.sigma], ['scratch', 'Scratch', I.pencil], ['graph', 'Graph', I.graph], ['circle', 'Unit circle', I.circle], ['timer', 'Focus', I.timer], ['ask', 'Ask Claude', I.ask]]
      .map(([k, l, ico]) => `<button class="dock-btn" data-tool="${k}" aria-pressed="false" title="${l}">${ico}<span>${{ 'Unit circle': 'Circle', 'Ask Claude': 'Ask', Calculator: 'Calc' }[l] || l}</span></button>`).join('')}
  </nav>
  <div class="scrim" id="scrim"></div>
  <aside class="drawer" id="drawer" aria-hidden="true" aria-labelledby="drawerTitle">
    <div class="drawer-grab"></div>
    <div class="drawer-head"><h2 id="drawerTitle"></h2><button class="icon-btn" data-close-tool aria-label="Close tool">${I.x}</button></div>
    <div class="drawer-body" id="drawerBody"></div>
  </aside>`;
  view = document.getElementById('view');
  document.addEventListener('click', (e) => {
    const t = e.target.closest('[data-tool]'); if (t) { UI.toggleTool(t.dataset.tool); return; }
    if (e.target.closest('[data-close-tool]') || e.target.id === 'scrim') { UI.closeTool(); return; }
    const a = e.target.closest('[data-act]');
    if (a && ACT[a.dataset.act]) { e.preventDefault(); ACT[a.dataset.act](a, e); }
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { if (document.querySelector('.modal')) closeModal(); else UI.closeTool(); }
    const typing = /INPUT|TEXTAREA|SELECT/.test((e.target.tagName || '')) || e.target.isContentEditable;
    if (typing || e.metaKey || e.ctrlKey || e.altKey) return;
    if (e.key === 'p' || e.key === 'P') {
      // P pauses whatever clock is on screen: the test clock first, else the focus sprint
      if (app.route.name === 'test' && app.TS && app.TS.stage === 'q' && app.TS.timed) { e.preventDefault(); ACT.tsPause(); return; }
      if (UI.Sprint && !UI.Sprint.idle()) { e.preventDefault(); ACT.sprintPP(); return; }
    }
    if (app.route.name === 'unit' && app.route.tab === 'practice') {
      if (practiceMode(app.route.unit) === 'set') { if (e.key === 'h') ACT.setHint(); else if (e.key === 'r') ACT.setRead(); }
      else if (app.P) { if (e.key === 'h') ACT.hint(); else if (e.key === 'r') ACT.read(); else if (e.key === 'n' && app.P.done) ACT.nextProblem(); }
    }
  });
  let saved = null;
  try { saved = JSON.parse(sessionStorage.getItem('c2pg.route') || 'null'); } catch (e) { saved = null; }
  if (saved && ['home', 'unit', 'method', 'test', 'traps', 'guide'].includes(saved.name)) app.route = saved.name === 'method' || saved.name === 'test' ? { name: 'home' } : saved;
  if (app.route.name === 'unit' && !M.unit(app.route.unit)) app.route = { name: 'home' };
  render();
  UI.initTools && UI.initTools();
  if (UI.Sprint) UI.Sprint.on(() => {
    const b = document.getElementById('fbSprintBtn'); if (!b) return;
    const c = sprintChip(); if (b.dataset.k === c.k) return;
    b.dataset.k = c.k; b.className = `chip sprint-chip ${c.cls}`; b.innerHTML = c.html; b.setAttribute('aria-label', c.label); b.title = c.title;
  });
  // time on a quiz set counts only while it is on screen and you are around (5+ quiet minutes = you stepped away)
  let lastActive = Date.now();
  ['pointerdown', 'keydown', 'input'].forEach((ev) => document.addEventListener(ev, () => { lastActive = Date.now(); }, { capture: true, passive: true }));
  setInterval(() => {
    if (document.hidden || Date.now() - lastActive > 5 * 60000) return;
    const r = app.route; if (r.name !== 'unit' || r.tab !== 'practice' || practiceMode(r.unit) !== 'set') return;
    const S = app.SET[r.unit]; if (S && S.stage !== 'report') S.act = (S.act || 0) + 1000;
  }, 1000);
  Store.connect(() => {
    // a set this device just generated (untouched) gives way to the one saved on your account
    for (const k of Object.keys(app.SET)) { const S = app.SET[k]; if (S && S.stage === 'work' && !S.items.some((it) => it.ans.trim() || it.hints)) delete app.SET[k]; }
    render(); UI.toast(`${I.check} Progress loaded from your account`);
  });
};

function render() {
  header();
  const r = app.route;
  document.body.className = r.unit ? `u-${r.unit}` : '';
  if (r.name === 'home') renderHome();
  else if (r.name === 'unit') renderUnit();
  else if (r.name === 'method') renderMethod();
  else if (r.name === 'test') renderTest();
  else if (r.name === 'traps') renderTraps();
  else if (r.name === 'guide') UI.renderGuide(view);
}
UI.render = render;

/* ================= HOME — one obvious next step ================= */
const todayCount = () => { const d = new Date().toDateString(); return st().history.filter((h) => new Date(h.t).toDateString() === d).length; };
function setsToBoss(k) {
  const u = st().units[k]; const rem = 100 - u.mastery; if (rem <= 0) return 0;
  const perfect = setLevels(k, st().settings.setSize || 5).reduce((a, l) => a + (SET_GAIN[l] || 12), 0);
  return Math.max(1, Math.ceil(rem / (perfect * 0.75)));
}
/** progress of an unfinished quiz set, in memory or saved */
function setProgress(k) {
  const mem = app.SET[k];
  if (mem && mem.stage !== 'report') return { total: mem.items.length, done: mem.items.filter((it) => it.ans.trim()).length, touched: mem.items.some((it) => it.ans.trim() || it.hints) };
  const sv = st().sets[k];
  if (sv && Array.isArray(sv.items) && sv.items.length) return { total: sv.items.length, done: sv.items.filter((it) => String(it.ans || '').trim()).length, touched: sv.items.some((it) => String(it.ans || '').trim() || it.hints) };
  return null;
}
function renderHome() {
  const s = st();
  const cur = currentUnit();
  const cu = s.units[cur.key];
  const mode = practiceMode(cur.key);
  const size = s.settings.setSize || 5;
  const prog = setProgress(cur.key);
  let cta, tab = 'practice', note;
  if (!cu.lessonDone) { cta = 'Start the lesson'; tab = 'learn'; note = `${M.LESSONS[cur.key].length} quick picture cards, about 5 minutes`; }
  else if (cu.mastery >= 100 && !cu.quizPassed) { cta = 'Take the Boss Quiz'; tab = 'quiz'; note = '8 questions, graded at the end. Get 7 right to unlock the next section.'; }
  else if (mode === 'set' && prog && prog.touched) { cta = 'Resume your set'; note = `${prog.done} of ${prog.total} answered. Pick up right where you left off.`; }
  else if (mode === 'set') { cta = 'Start a quiz set'; note = `${size} problems · about ${size * 2} minutes · graded at the end`; }
  else { cta = mode === 'test' ? 'Practice with instant check' : 'Practice step by step'; note = 'One problem at a time'; }
  const goal = s.settings.goal || 10, today = todayCount();
  const left = setsToBoss(cur.key);
  const milestone = cu.quizPassed ? 'Mastered ✓' : cu.mastery >= 100 ? 'Boss Quiz unlocked' : `About ${left} strong set${left > 1 ? 's' : ''} to unlock the Boss Quiz`;
  const traps = Object.entries(s.traps).sort((x, y) => y[1] - x[1]).slice(0, 3);
  const showOne = cu.lessonDone && mode === 'set' && !(prog && prog.touched) && !(cu.mastery >= 100 && !cu.quizPassed);
  view.innerHTML = `
  <div class="home-top">
    <section class="card nextup u-${cur.key}" aria-labelledby="nuTitle">
      <div class="eyebrow">Next up · Section ${cur.sec}</div>
      <h1 id="nuTitle">${cur.name}</h1>
      <div class="nu-sample">${T(cur.sample)}</div>
      <button class="btn accent xl" data-act="nextUp" data-u="${cur.key}" data-tab="${tab}">${cta} ${I.play}</button>
      <p class="nu-note">${UI.esc(note)}</p>
      <div class="milestone"><span class="tnum">${cu.mastery}%</span><div class="xpbar"><i style="width:${cu.mastery}%"></i></div><span>${UI.esc(milestone)}</span></div>
      <div class="row nu-more">
        ${showOne ? `<button class="btn sm soft" data-act="justOne" data-u="${cur.key}">${I.bolt} Just 1 problem</button>` : ''}
        <button class="btn sm soft" data-act="guide" data-u="${cur.key}">${I.list} Study guide</button>
        <button class="btn sm soft" data-act="method">${I.target} 60-second Which Method?</button>
      </div>
    </section>
    <section class="card today" aria-label="Today">
      <div class="eyebrow">Today</div>
      <div class="goal-ring">${UI.ring(Math.min(1, today / goal), 132, 11, 'var(--mint)')}<div class="gr-n"><div class="tnum">${today}<small>of ${goal}</small></div></div></div>
      <p class="muted" style="font-size:14.5px">${today >= goal ? 'Daily goal done. Anything more is a bonus.' : today ? `${goal - today} more to hit today's goal` : 'Problems you finish today fill this ring.'}</p>
      <span class="chip fire">${I.flame}<b class="tnum">${UI.streakDays()}</b>&nbsp;day streak</span>
      <div class="goal-pick"><span class="muted">Daily goal</span><div class="seg" role="group" aria-label="Daily goal in problems">${[5, 10, 15, 20].map((g) => `<button data-act="goal" data-n="${g}" aria-pressed="${g === goal}">${g}</button>`).join('')}</div></div>
    </section>
  </div>
  <div class="home-grid">
    <div>
      <div class="eyebrow" style="margin:0 0 12px 4px">Your path</div>
      <div class="path">
      ${M.UNITS.map((u) => station(u, u.key === cur.key)).join('')}
      <div class="station"><div class="node">${UI.ring(ORDER.filter((k) => s.units[k].quizPassed).length / ORDER.length, 68, 5, 'var(--ink)')}<span class="${testLocked() ? 'lock' : 'num'}">${testLocked() ? I.lock : I.trophy}</span></div>
        <button class="station-card ${testLocked() ? 'locked' : ''}" data-act="test"><div><div class="eyebrow">Final boss</div><h3>Test Simulator</h3></div><span class="status ${s.test.best != null ? 'done' : ''}">${s.test.best != null ? `Best ${Math.round(s.test.best * 100)}%` : testLocked() ? 'Locked' : 'Ready'}</span><div class="sample muted" style="font-size:14.5px">12 mixed questions from all five sections, graded like the real test.</div></button></div>
      </div>
    </div>
    <aside class="side">
      <div class="card pad guide-card"><div class="row between"><h3>${I.list} Study guide</h3><button class="btn sm accent" data-act="guide" data-u="${cur.key}">Open ${I.next}</button></div>
        <p class="muted" style="font-size:14px;margin-top:6px">A step list for every scenario in 7.1 to 7.8, with pictures and a practice problem for each one.</p>
        <button class="btn sm soft" data-act="whichStart" style="margin-top:10px">${I.sign} Which method? Find my scenario</button></div>
      <div class="card pad"><div class="row between"><h3>Trap tracker</h3><button class="btn sm ghost" data-act="traps">All ${I.next}</button></div>
        ${traps.length ? `<div class="trap-mini">${traps.map(([k, n]) => `<div class="t"><span>${UI.esc((M.TRAPS[k] || { name: k }).name)}</span><b>×${n}</b></div>`).join('')}</div>` : '<p class="muted" style="font-size:14px;margin-top:8px">No traps logged yet. Every mistake type gets tracked here so you can drill it.</p>'}</div>
      <div class="card pad"><div class="eyebrow">Rank</div><h3 style="margin-top:4px">${UI.esc(UI.rank(s.xp).name)}</h3>
        <div class="mastery-line" style="margin-top:10px"><span class="tnum">${s.xp} XP</span><div class="xpbar"><i style="width:${rankPct()}%"></i></div></div></div>
    </aside>
  </div>`;
}
function rankPct() { const r = UI.rank(st().xp); if (!r.next) return 100; return Math.round((100 * (st().xp - r.floor)) / (r.next[0] - r.floor)); }
function station(u, current) {
  const us = st().units[u.key];
  const locked = isLocked(u.key);
  const status = locked ? ['Locked', ''] : us.quizPassed ? ['Mastered ✓', 'done'] : us.mastery >= 100 ? ['Boss quiz ready', 'boss'] : us.mastery > 0 ? [`Practicing · ${us.mastery}%`, 'live'] : us.lessonDone ? ['Ready to practice', ''] : ['Start here', current ? 'live' : ''];
  return `<div class="station u-${u.key}"><div class="node">${UI.ring(us.mastery / 100)}<span class="${locked ? 'lock' : 'num'}">${locked ? I.lock : u.sec}</span></div>
    <button class="station-card ${locked ? 'locked' : ''} ${current ? 'current' : ''}" data-act="openUnit" data-u="${u.key}">
      <div><div class="eyebrow">Section ${u.sec}</div><h3>${u.name}</h3></div>
      <span class="status ${status[1]}">${status[0]}</span>
      <div class="sample">${T(u.sample)}</div>
    </button></div>`;
}
/* ================= UNIT ================= */
function renderUnit() {
  const r = app.route; const u = M.unit(r.unit); const us = st().units[u.key];
  const preview = isLocked(u.key);
  if (preview && !r.peek) { UI.toast(`${I.lock} Beat the previous boss quiz to unlock ${u.sec}.`); app.route = { name: 'home' }; return render(); }
  const tab = r.tab || (us.lessonDone || preview ? 'practice' : 'learn');
  r.tab = tab;
  const quizLocked = preview || (us.mastery < 100 && !st().settings.unlockAll && !us.quizPassed);
  const fromGuide = tab === 'practice' && app.P && app.P.unit === u.key && app.P.guide && practiceMode(u.key) !== 'set';
  const focus = focusActive(u.key, tab);
  document.body.classList.toggle('focus', focus);
  view.innerHTML = `<div class="u-${u.key}">
    ${focus ? focusBar(u, tab) : `${fromGuide ? `<button class="backlink" data-act="gReturn">${I.back} Study guide</button>` : `<button class="backlink" data-act="home">${I.back} Map</button>`}
    <div class="unit-head">
      <div class="ring-big">${UI.ring(us.mastery / 100, 74, 6)}<div class="pct"><div>${us.mastery}%<small>mastery</small></div></div></div>
      <div><div class="eyebrow">Section ${u.sec} · Level ${levelFor(u.key)}${us.quizPassed ? ' · Mastered ✓' : ''}</div><h1><span class="sec">${u.sec}</span>${u.name}</h1></div>
      <div class="tabs" role="tablist">
        ${['learn', 'practice', 'quiz'].map((k) => `<button role="tab" aria-selected="${tab === k}" data-act="tab" data-tab="${k}">${k === 'quiz' && quizLocked ? `<span class="lk">${I.lock}</span>` : ''}${{ learn: 'Learn', practice: 'Practice', quiz: 'Boss Quiz' }[k]}</button>`).join('')}
      </div>
    </div>
    ${preview ? `<div class="preview-note">${I.lock}<span><b>Preview from the study guide.</b> Practice counts. The ${u.sec} Boss Quiz opens after you pass the ${M.unit(ORDER[ORDER.indexOf(u.key) - 1]).sec} one (or turn on "Unlock everything" in settings).</span></div>` : ''}`}
    <div id="unitBody"></div></div>`;
  const body = document.getElementById('unitBody');
  if (tab === 'learn') renderLearn(body, u);
  else if (tab === 'practice') renderPractice(body, u);
  else renderQuiz(body, u, quizLocked);
}
/* ---------- focus mode: only the problem, the answer box and your progress ---------- */
function focusActive(k, tab) {
  if (!st().settings.focus || app.focusOff) return false;
  if (tab === 'practice' && practiceMode(k) === 'set') {
    const S = app.SET[k]; const saved = st().sets[k];
    return (S ? S.stage : (saved && saved.stage) || 'work') === 'work';
  }
  return tab === 'quiz' && !!(app.Q && app.Q.unit === k && app.Q.stage === 'q');
}
/** the focus-bar timer chip: tap to start a sprint, then the same tap pauses and resumes it */
function sprintChip() {
  const S = UI.Sprint, t = S && S.state;
  if (!t || S.idle()) {
    const m = (t && t.mins) || 15;
    return { k: `idle${m}`, cls: '', html: `${I.timer}<span id="fbSprint">${m}-min sprint</span>`, label: `Start a ${m}-min focus sprint`, title: 'Start a focus sprint. A bar under the top bar shows the time left.' };
  }
  const m = Math.max(1, Math.ceil(t.left / 60)), brk = t.mode === 'break';
  return t.running
    ? { k: `run${m}${brk}`, cls: 'live', html: `${I.pause}<span id="fbSprint">${m} min${brk ? ' break' : ''}</span>`, label: `${m} min${brk ? ' break' : ''} left. Tap to pause.`, title: 'Pause (P)' }
    : { k: `hold${m}${brk}`, cls: 'paused', html: `${I.play}<span id="fbSprint">Paused · ${m} min</span>`, label: `Paused, ${m} min${brk ? ' of break' : ''} left. Tap to resume.`, title: 'Resume (P)' };
}
function focusBar(u, tab) {
  const c = sprintChip();
  return `<div class="focusbar">
    <button class="fb-btn" data-act="focusExit" aria-label="Exit focus mode">${I.x}<span>Exit focus</span></button>
    <span class="fb-title">${u.sec} ${UI.esc(u.short)} · ${tab === 'quiz' ? 'Boss Quiz' : 'Quiz set'}</span>
    <span class="fb-tools">
      <button class="chip sprint-chip ${c.cls}" id="fbSprintBtn" data-act="sprint" data-k="${c.k}" aria-label="${c.label}" title="${c.title}">${c.html}</button>
      <button class="chip" data-act="noise" aria-pressed="${!!(UI.Noise && UI.Noise.on)}" title="Brown noise to help you focus">${I.headphones}<span>Focus sound</span></button>
    </span>
  </div>`;
}
ACT.focusExit = () => { app.focusOff = true; render(); };
ACT.focusOn = () => { app.focusOff = false; render(); G.scrollTo({ top: 0 }); };
ACT.sprint = () => {
  const S = UI.Sprint; if (!S) return;
  if (S.idle()) { S.start(S.state.mins || 15); UI.toast(`${I.timer} ${S.state.mins}-minute sprint started. Tap the timer again any time to pause.`, 3500, 'timer'); return; }
  ACT.sprintPP();
};
/** one tap: pause a running sprint (or break), resume a paused one */
ACT.sprintPP = () => {
  const S = UI.Sprint; if (!S || S.idle()) return;
  UI.Sound.play('tick');
  if (S.state.running) { S.pause(); UI.toast(`${I.pause} Timer paused. Tap it again when you're ready.`, 2600, 'timer'); }
  else { S.start(); UI.toast.clear('timer'); }
};
ACT.noise = () => { const on = UI.Noise.toggle(); if (on) UI.toast(`${I.headphones} Brown noise on. Tap again to stop.`, 2500); };
ACT.takeBreak = () => { UI.Sprint.start(2, 'break'); UI.toast(`${I.timer} 2-minute break. Stand up, stretch, drink some water.`, 3500, 'timer'); };
ACT.home = () => go({ name: 'home' });
const dropGuide = (k) => { if (app.P && app.P.unit === k && app.P.guide) app.P = null; };
ACT.nextUp = (el) => { const k = el.dataset.u; if (isLocked(k)) return; dropGuide(k); if (el.dataset.tab === 'quiz') app.Q = null; go({ name: 'unit', unit: k, tab: el.dataset.tab || 'practice' }); };
ACT.justOne = (el) => { const k = el.dataset.u; if (isLocked(k)) return; app.SET[k] = newSet(k, [{ level: levelFor(k), family: null }], 'one'); delete st().sets[k]; go({ name: 'unit', unit: k, tab: 'practice' }); };
ACT.goal = (el) => { st().settings.goal = +el.dataset.n || 10; Store.save(); render(); };
ACT.openUnit = (el) => { const k = el.dataset.u; if (isLocked(k)) { UI.toast(`${I.lock} Pass the ${M.unit(ORDER[ORDER.indexOf(k) - 1]).sec} boss quiz to unlock this. (Or turn on "Unlock everything" in settings.)`, 3400); return; } dropGuide(k); go({ name: 'unit', unit: k }); };
ACT.tab = (el) => { app.route.tab = el.dataset.tab; render(); };
ACT.method = () => go({ name: 'method' });
ACT.test = () => { if (testLocked()) { UI.toast(`${I.lock} Master all five sections to unlock the Test Simulator. (Or "Unlock everything" in settings.)`, 3400); return; } go({ name: 'test' }); };
ACT.guide = (el) => { const u = (el && el.dataset && el.dataset.u) || (app.route.unit) || currentUnit().key; go({ name: 'guide', unit: M.GUIDE[u] ? u : 'ibp' }); };
ACT.stepList = () => { UI.openTool('steps'); };
ACT.traps = () => go({ name: 'traps' });

/* ================= LEARN ================= */
function renderLearn(body, u) {
  const cards = M.LESSONS[u.key];
  const i = Math.min(app.L[u.key] || 0, cards.length - 1);
  const c = cards[i];
  const vis = c.visual && UI.VIS[c.visual.type] ? UI.VIS[c.visual.type](c.visual) : null;
  body.innerHTML = `<div class="lesson">
    <div class="card lesson-card">
      <div class="row between"><span class="eyebrow">Lesson ${i + 1} of ${cards.length}</span><button class="tbtn" data-act="readLesson">${I.speaker} Read</button></div>
      <h2 style="margin-top:6px">${R(c.title)}</h2>
      <p class="body">${R(c.body)}</p>
      ${vis ? `<div class="visual" id="lv">${vis.html}</div>` : ''}
      ${c.check ? `<div class="mini-check"><div class="q">${R(c.check.prompt)}</div><div class="opts" id="lc">${c.check.options.map((o, k) => `<button class="opt" data-k="${k}"><span class="key">${'ABCD'[k]}</span><span>${o.tex ? T(o.tex) : R(o.text)}</span></button>`).join('')}</div><div id="lcf" style="margin-top:8px"></div></div>` : ''}
    </div>
    <div class="dots">${cards.map((_, k) => `<i class="${k === i ? 'on' : k < i ? 'done' : ''}"></i>`).join('')}</div>
    <div class="row between">
      <button class="btn ghost" data-act="lessonNav" data-d="-1" ${i === 0 ? 'disabled' : ''}>${I.back} Back</button>
      ${i < cards.length - 1 ? `<button class="btn accent" data-act="lessonNav" data-d="1">Next ${I.next}</button>` : `<button class="btn accent" data-act="lessonDone">Start practicing ${I.next}</button>`}
    </div>
    <button class="g-link" data-act="guide" data-u="${u.key}">${I.list}<span>Every ${u.sec} scenario as a step list</span>${I.next}</button></div>`;
  if (vis && vis.mount) vis.mount(document.getElementById('lv'));
  const lc = document.getElementById('lc');
  if (lc) lc.querySelectorAll('.opt').forEach((b) => (b.onclick = () => {
    const o = c.check.options[+b.dataset.k];
    lc.querySelectorAll('.opt').forEach((x) => { x.disabled = true; if (c.check.options[+x.dataset.k].ok) x.classList.add('right'); });
    if (!o.ok) b.classList.add('wrong');
    UI.Sound.play(o.ok ? 'good' : 'bad');
    document.getElementById('lcf').innerHTML = `<div class="feedback ${o.ok ? 'good' : 'bad'}"><span class="mark">${o.ok ? '✓' : '✗'}</span><span>${o.ok ? 'Exactly.' : R(o.msg || 'Not quite.')}</span></div>`;
  }));
}
ACT.lessonNav = (el) => { const k = app.route.unit; app.L[k] = Math.max(0, (app.L[k] || 0) + +el.dataset.d); UI.Voice.stop(); renderUnit(); };
ACT.lessonDone = () => {
  const k = app.route.unit; const us = st().units[k];
  if (!us.lessonDone) { us.lessonDone = true; st().xp += 30; markDay(); Store.save(); UI.toast(`<span class="big">+30</span> XP for finishing the lesson`); }
  app.L[k] = 0; app.route.tab = 'practice'; render();
};
ACT.readLesson = () => { const c = M.LESSONS[app.route.unit][app.L[app.route.unit] || 0]; let txt = UI.speakText(c.title) + '. ' + UI.speakText(c.body); if (c.visual && c.visual.lines) txt += '. ' + c.visual.lines.map((l) => M.speak(l)).join('. '); UI.Voice.say(txt); };

/* ================= PRACTICE ================= */
function rngFor(id, salt) { let h = 2166136261; const s = id + ':' + salt; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return M.rng(h >>> 0); }
const MODES = { set: 'Quiz set', test: 'Instant check', steps: 'Step by step' };
/** which practice mode this unit shows: a forced drill wins, then your saved choice */
function practiceMode(unitKey) {
  if (app.P && app.P.unit === unitKey && app.P.forced) return app.P.mode;
  const m = st().settings.mode;
  if (m === 'set' || m === 'test' || m === 'steps') return m;
  return st().units[unitKey].mastery < 30 ? 'steps' : 'test';
}
function newProblem(unitKey, opts = {}) {
  const level = opts.level || levelFor(unitKey);
  const prev = app.P && app.P.unit === unitKey ? app.P : null;
  // a problem opened from the study guide keeps serving that same scenario until you switch modes
  const guide = opts.guide !== undefined ? opts.guide : (prev && prev.guide) || null;
  const p = opts.p || (guide && M.guideTry ? M.guideTry(unitKey, guide.sc, level, M.rng(), opts.family) : M.generate(unitKey, level, M.rng(), opts.family));
  const mode = opts.mode || (prev ? prev.mode : 'test');
  app.count++;
  app.P = {
    unit: unitKey, p, mode, forced: opts.forced ?? (prev ? !!prev.forced : false), n: app.count, cur: 0, hints: 0, done: false, result: null, twin: !!opts.twin, drill: opts.drill || null, guide,
    steps: p.steps.map((s, i) => ({ status: i === 0 ? 'current' : 'pending', tries: 0, pts: 0, fb: null, tag: null, order: s.check && s.check.kind === 'choice' ? rngFor(p.id, i).shuffle(s.check.options.map((_, k) => k)) : null, input: '' })),
    testInput: '', solShown: 0, solAll: false,
  };
  if (st().settings.autoRead) setTimeout(() => UI.Voice.say(p.speech), 250);
}
UI.newProblem = newProblem;
const guideName = (P) => { const g = M.GUIDE[P.unit]; const sc = g && P.guide && g.scenarios.find((x) => x.key === P.guide.sc); return sc ? sc.name : 'Study guide'; };
function modeBar(u, mode, count) {
  const us = st().units[u.key];
  const n = count || st().settings.setSize || 5;
  const note = {
    set: `${n} problems. Nothing gets checked while you work. You get graded all at once at the end.`,
    test: 'Type the final answer and get graded right away.',
    steps: 'Every step gets checked as you go, with coaching.',
  }[mode];
  const lvl = mode === 'set' ? (us.levelPin ? `Level ${us.levelPin} · pinned` : 'Levels · auto') : `Level ${levelFor(u.key)}${us.levelPin ? ' · pinned' : ' · auto'}`;
  return `<div class="ptop">
      <div class="seg" role="group" aria-label="Practice mode">${Object.keys(MODES).map((m) => `<button data-act="mode" data-m="${m}" aria-pressed="${mode === m}">${MODES[m]}</button>`).join('')}</div>
      <span class="row">${mode === 'set' && st().settings.focus && app.focusOff ? `<button class="chip" data-act="focusOn" title="Hide everything except the problem">${I.target} Focus mode</button>` : ''}<button class="chip" data-act="level" title="Change difficulty">${lvl}</button></span>
    </div>
    <p class="mode-note">${note}</p>
    <div class="mastery-line"><span>Mastery</span><div class="xpbar"><i style="width:${us.mastery}%"></i></div><span class="tnum">${us.mastery}%</span></div>`;
}
function renderPractice(body, u) {
  const mode = practiceMode(u.key);
  if (mode === 'set') return renderSet(body, u);
  if (!app.P || app.P.unit !== u.key || app.P.mode !== mode) newProblem(u.key, { mode });
  const P = app.P, p = P.p;
  body.innerHTML = `<div class="practice">
    ${modeBar(u, P.mode)}
    <div class="problem-card">
      <div class="meta"><span class="eyebrow">${P.guide ? `Study guide · ${UI.esc(guideName(P))}` : P.twin ? 'Lock-in redo' : P.drill ? 'Trap drill' : 'Problem ' + P.n} · ${P.mode === 'steps' ? 'step by step' : 'instant check'}</span><span class="tag-fam">${UI.esc(p.famLabel)}</span></div>
      <div class="integral" id="theIntegral">${T(p.tex, true)}</div>
      <div class="tool-row">
        <button class="tbtn" data-act="read">${I.speaker} Read it</button>
        <button class="tbtn" data-act="stepList">${I.list} Step list</button>
        ${P.mode === 'test' ? `<button class="tbtn" data-act="hint" ${P.hints >= p.steps.length || P.done ? 'disabled' : ''}>${I.bulb} ${peekLabel(P.hints, p.steps.length)}</button>` : `<button class="tbtn" data-act="hint" ${P.hints >= p.hints.length || P.done ? 'disabled' : ''}>${I.bulb} Hint <span class="muted tnum">${p.hints.length - P.hints}</span></button>`}
        <button class="tbtn" data-act="graphIt">${I.graph} Graph it</button>
        <button class="tbtn" data-act="skip">${I.dice} New problem</button>
      </div>
    </div>
    ${P.mode === 'test' ? `<div class="peek" id="peek">${peekHTML(p, P.hints, P.peekOpen)}</div>` : `<div class="hints" id="hints">${p.hints.slice(0, P.hints).map((h, i) => `<div class="hint"><b>${i + 1}</b><span>${R(h)}</span></div>`).join('')}</div>`}
    <div id="work"></div>
    <div id="resultBox"></div>
  </div>`;
  renderWork();
  if (P.result) renderResult();
}
ACT.mode = (el) => {
  const m = el.dataset.m, k = app.route.unit;
  if (!MODES[m]) return;
  st().settings.mode = m; Store.save();
  if (app.P && app.P.unit === k) app.P.forced = false;
  if (app.P && app.P.unit === k && app.P.guide && m !== app.P.mode) app.P.guide = null;
  if (m !== 'set' && !(app.P && app.P.unit === k && app.P.mode === m && !app.P.done)) newProblem(k, { mode: m, forced: false, guide: null });
  renderUnit();
};
ACT.level = () => {
  const k = app.route.unit; const us = st().units[k];
  us.levelPin = (us.levelPin + 1) % 4; Store.save();
  if (practiceMode(k) === 'set') {
    const S = app.SET[k];
    const fresh = S && S.stage === 'work' && !S.items.some((it) => it.ans.trim() || it.hints);
    if (fresh) { app.SET[k] = newSet(k); delete st().sets[k]; }
    const later = S && !fresh ? ' (starting with your next set)' : '';
    UI.toast(us.levelPin ? `Problems pinned to level ${us.levelPin}${later}` : `Levels back to auto: they follow your mastery${later}`);
  } else {
    UI.toast(us.levelPin ? `Level pinned to ${us.levelPin}` : 'Level back to auto (it follows your mastery)');
    newProblem(k, { mode: app.P && app.P.unit === k ? app.P.mode : practiceMode(k) });
  }
  renderUnit();
};
ACT.skip = () => { newProblem(app.route.unit, { mode: app.P.mode }); renderUnit(); };
ACT.read = () => { if (app.P) UI.Voice.say(app.P.p.speech); };
/* ---------- Hints that walk you through the solution: one worked step per tap ---------- */
const cleanThink = (t) => String(t || '').replace(/\s*\(Type [^)]*\)\.?/g, '');
const peekLabel = (n, total) => (n >= total ? `All ${total} steps shown` : `Show step ${n + 1} of ${total}`);
/** revealed steps: the open one in full, the rest folded to one line showing where that step landed */
function peekHTML(p, n, open) {
  if (!n) return '';
  if (open == null || open < 0 || open >= n) open = n - 1;
  return p.steps.slice(0, n).map((s, i) => {
    if (i !== open) {
      const last = s.lines[s.lines.length - 1] || '';
      return `<button class="peek-mini" data-act="peekOpen" data-i="${i}" aria-label="Open step ${i + 1} again"><span class="pn">${i + 1}</span><span class="pt">${R(s.title)}</span><span class="pm">${T(last)}</span></button>`;
    }
    return `<div class="peek-step" id="peek${i}">
      <div class="peek-head"><span class="pn">${i + 1}</span><b>${R(s.title)}</b><span class="muted tnum">step ${i + 1} of ${p.steps.length}</span><button class="icon-btn sm" data-act="readPeek" data-i="${i}" aria-label="Read step ${i + 1} aloud">${I.speaker}</button></div>
      <div class="think"><span class="bulb">${I.bulb}</span><span>${R(cleanThink(s.think))}</span></div>
      ${s.tag === 'triangle' && p.triangle ? `<div class="viz">${UI.triangle({ ...p.triangle })}</div>` : ''}
      ${s.pic && p.pic ? UI.impPic(p) : ''}
      <div class="math-lines">${s.lines.map((l) => T(l, true)).join('')}</div>
    </div>`;
  }).join('');
}
/** whose hints these are: the current quiz-set problem, or the single practice problem */
function peekOwner() {
  const k = app.route.unit;
  if (practiceMode(k) === 'set') { const S = app.SET[k]; return S && S.stage === 'work' ? S.items[S.i] : null; }
  return app.P && app.P.unit === k && app.P.mode === 'test' ? app.P : null;
}
function paintPeek(m) {
  const box = document.getElementById('peek'); if (box) box.innerHTML = peekHTML(m.p, m.hints, m.peekOpen);
  const b = document.querySelector('[data-act="setHint"], [data-act="hint"]');
  if (b) { b.innerHTML = `${I.bulb} ${peekLabel(m.hints, m.p.steps.length)}`; b.disabled = m.hints >= m.p.steps.length; }
}
const readStepAloud = (s) => UI.Voice.say(UI.speakText(s.title) + '. ' + UI.speakText(cleanThink(s.think)) + '. ' + s.lines.map((l) => M.speak(l)).join('. '));
function revealNext(m, after) {
  if (m.hints >= m.p.steps.length) return;
  m.hints++; m.peekOpen = m.hints - 1;
  paintPeek(m);
  if (after) after();
  const el = document.getElementById('peek' + m.peekOpen);
  if (el) { el.classList.add('flash'); el.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
  UI.Sound.play('tick');
  if (st().settings.autoRead) readStepAloud(m.p.steps[m.peekOpen]);
}
ACT.peekOpen = (el) => { const m = peekOwner(); if (!m) return; m.peekOpen = +el.dataset.i; paintPeek(m); const o = document.getElementById('peek' + m.peekOpen); if (o) o.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); };
ACT.readPeek = (el) => { const m = peekOwner(); if (m) readStepAloud(m.p.steps[+el.dataset.i]); };
ACT.hint = () => {
  const P = app.P; if (!P || P.done) return;
  if (P.mode === 'test') { revealNext(P); return; }
  if (P.hints >= P.p.hints.length) return;
  P.hints++;
  const h = document.getElementById('hints');
  if (h) h.insertAdjacentHTML('beforeend', `<div class="hint"><b>${P.hints}</b><span>${R(P.p.hints[P.hints - 1])}</span></div>`);
  const b = document.querySelector('[data-act="hint"]'); if (b) { b.querySelector('.muted').textContent = P.p.hints.length - P.hints; if (P.hints >= P.p.hints.length) b.disabled = true; }
};
ACT.graphIt = () => { UI.openGraphForProblem && UI.openGraphForProblem(app.P); };
ACT.nextProblem = () => { newProblem(app.route.unit, { mode: app.P.mode }); renderUnit(); G.scrollTo({ top: 0 }); };
ACT.twin = () => { const P = app.P; newProblem(P.unit, { family: P.p.family, twin: true, mode: P.mode }); renderUnit(); G.scrollTo({ top: 0 }); };
ACT.retrySame = () => { const P = app.P; P.result = null; P.done = false; P.testInput = ''; renderUnit(); };

/* ---------- math input component ---------- */
UI.mathField = function (id, { vars = ['x'], pre = '', post = '', placeholder = 'Type your answer', btn = 'Check', kbOpen, improper = false } = {}) {
  const coarse = G.matchMedia && G.matchMedia('(pointer: coarse)').matches;
  const ks = st().settings.keypad;
  const open = kbOpen ?? (ks === 'on' || (ks === 'auto' && coarse));
  const v1 = vars[0] === 'θ' ? 'θ' : vars[0] || 'x';
  const varKey = vars.length ? `<button class="var" data-k="${vars[0] === 'θ' ? 'θ' : vars[0]}">${v1}</button>` : '<button class="op" data-k="/">÷</button>';
  const rows = [
    ['7', '8', '9', '(', ')', '^', '⌫'],
    ['4', '5', '6', '*', '/', vars.length ? 'VAR' : 'π', 'π'],
    ['1', '2', '3', '+', '-', 'e^', '√'],
    ['0', '.', 'e', 'sin', 'cos', 'tan', 'ln'],
    improper ? ['arctan', 'arcsin', '| |', '∞', 'DIV', 'DIV2', '⌫'] : ['sec', 'csc', 'cot', 'arcsin', 'arctan', '| |', vars.includes('x') ? '+C' : '⌫'],
  ];
  const key = (k) => {
    if (k === 'VAR') return varKey;
    if (k === 'DIV2') return '';
    if (k === 'DIV') return '<button class="div-key" data-k="DIV" aria-label="Diverges" style="grid-column:span 2">Diverges</button>';
    const lab = { '*': '×', '/': '÷', '-': '−', '⌫': '⌫', 'e^': 'eˣ', '√': '√', '| |': '|□|', arcsin: 'sin⁻¹', arctan: 'tan⁻¹' }[k] || k;
    const cls = /^[a-z]{2,}/.test(k) ? 'fn' : '+-*/^()'.includes(k) ? 'op' : k === '⌫' ? 'act' : '';
    return `<button class="${cls}" data-k="${UI.esc(k)}" aria-label="${UI.esc(k === '∞' ? 'infinity' : k)}">${lab}</button>`;
  };
  return `<div class="mathin" id="${id}" data-vars="${vars.join(',')}"${improper ? ' data-imp="1"' : ''}>
    <div class="mathin-row">${pre ? `<span class="mathin-pre">${T(pre)}</span>` : ''}<input type="text" id="${id}-in" autocomplete="off" autocapitalize="off" spellcheck="false" placeholder="${UI.esc(placeholder)}" inputmode="${open && coarse ? 'none' : 'text'}" aria-label="${UI.esc(placeholder)}">${post ? `<span class="mathin-pre">${T(post)}</span>` : ''}<button class="kb-toggle" type="button" aria-pressed="${open}" aria-label="Math keypad">${I.kb}</button></div>
    <div class="preview" aria-live="polite"><span class="lbl">reads as</span><span class="pv"><span class="empty">your answer appears here</span></span></div>
    <div class="keypad" ${open ? '' : 'hidden'}>${rows.flat().map(key).join('')}
      <button class="op" data-k="←">←</button><button class="op" data-k="→">→</button><button class="op" data-k="clear">clear</button><button class="op" data-k="abc">ABC</button><button class="act" data-k="enter" style="grid-column:span 3">${UI.esc(btn)} ↵</button></div>
    <div class="hint-line">${improper ? 'A number like <span class="mono">1/2</span>, <span class="mono">pi/4</span>, <span class="mono">ln(2)</span>, <span class="mono">2sqrt(3)</span>, or the word <span class="mono">diverges</span>.' : `${vars.length ? `Use ${vars.map((v) => (v === 'θ' ? 'θ (type theta or t)' : v)).join(', ')}. ` : 'A number: fractions like 3/4 are fine. '}Type <span class="mono">sin^2(x)</span>, <span class="mono">e^(2x)</span>, <span class="mono">ln|x-1|</span>, <span class="mono">sqrt(9-x^2)</span>.`}</div>
  </div>`;
};
UI.wireMathField = function (id, onSubmit, initial = '', onChange = null) {
  const root = document.getElementById(id); if (!root) return null;
  const inp = root.querySelector('input'), pv = root.querySelector('.pv'), kp = root.querySelector('.keypad'), tog = root.querySelector('.kb-toggle');
  const vars = root.dataset.vars ? root.dataset.vars.split(',').filter(Boolean) : [];
  inp.value = initial;
  const upd = () => {
    const v = inp.value;
    if (onChange) onChange(v);
    if (!v.trim()) { pv.innerHTML = '<span class="empty">your answer appears here</span>'; inp.classList.remove('err'); return; }
    if (root.dataset.imp) {
      const q = M.readImproper(v);
      if (q.kind === 'invalid') pv.innerHTML = `<span class="err">${UI.esc(q.msg)}</span>`; else if (q.tex) pv.innerHTML = T(q.tex);
      return;
    }
    const r = M.parse(v, { vars });
    if (r.ok) { pv.innerHTML = T(r.tex); inp.classList.remove('err'); }
    else if (r.empty) pv.innerHTML = '<span class="empty">…</span>';
    else { pv.innerHTML = `<span class="err">${UI.esc(r.error)}</span>`; }
  };
  inp.addEventListener('input', upd);
  inp.addEventListener('keydown', (e) => { if (e.key === 'Enter') { e.preventDefault(); onSubmit(inp.value); } });
  tog.onclick = () => {
    const open = kp.hidden; kp.hidden = !open; tog.setAttribute('aria-pressed', String(open));
    const coarse = G.matchMedia && G.matchMedia('(pointer: coarse)').matches;
    inp.setAttribute('inputmode', open && coarse ? 'none' : 'text');
    st().settings.keypad = open ? 'on' : 'off'; Store.save();
  };
  const insert = (txt, back = 0) => {
    const s = inp.selectionStart ?? inp.value.length, e = inp.selectionEnd ?? s;
    inp.value = inp.value.slice(0, s) + txt + inp.value.slice(e);
    const pos = s + txt.length - back; inp.setSelectionRange(pos, pos); upd();
  };
  kp.addEventListener('pointerdown', (e) => { if (e.target.closest('button')) e.preventDefault(); });
  kp.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    const k = b.dataset.k; UI.Sound.play('tick');
    if (document.activeElement !== inp) inp.focus({ preventScroll: true });
    const s = inp.selectionStart ?? inp.value.length;
    if (k === '⌫') { if (inp.selectionStart !== inp.selectionEnd) insert(''); else if (s > 0) { inp.value = inp.value.slice(0, s - 1) + inp.value.slice(s); inp.setSelectionRange(s - 1, s - 1); upd(); } }
    else if (k === '←') inp.setSelectionRange(Math.max(0, s - 1), Math.max(0, s - 1));
    else if (k === '→') inp.setSelectionRange(s + 1, s + 1);
    else if (k === 'clear') { inp.value = ''; upd(); }
    else if (k === 'abc') { inp.setAttribute('inputmode', 'text'); inp.blur(); setTimeout(() => inp.focus(), 30); }
    else if (k === 'enter') onSubmit(inp.value);
    else if (['sin', 'cos', 'tan', 'sec', 'csc', 'cot', 'ln', 'arcsin', 'arctan'].includes(k)) insert(k + '()', 1);
    else if (k === 'e^') insert('e^()', 1);
    else if (k === '√') insert('sqrt()', 1);
    else if (k === '| |') insert('||', 1);
    else if (k === '+C') insert(' + C');
    else if (k === 'DIV') { inp.value = 'diverges'; inp.setSelectionRange(8, 8); upd(); }
    else insert(k);
  });
  if (initial) upd();
  return { input: inp, set(v) { inp.value = v; upd(); } };
};

/* ---------- step-by-step work ---------- */
function renderWork() {
  const P = app.P; const work = document.getElementById('work'); if (!work) return;
  if (P.mode === 'test') return renderTestInput(work);
  const p = P.p;
  work.innerHTML = `<div class="steps">${p.steps.map((s, i) => stepHTML(s, i)).join('')}</div>`;
  const cur = p.steps[P.cur];
  if (!P.done && cur) wireStep(P.cur);
}
function ptsLabel(s, ss) {
  const pts = s.check ? s.check.points : 0;
  if (!pts) return ss.status === 'ok' || ss.status === 'bad' ? '✓' : '';
  if (ss.status === 'ok') return `+${ss.pts}`;
  if (ss.status === 'bad') return `${ss.pts}/${pts}`;
  return `${pts} pt${pts > 1 ? 's' : ''}`;
}
function stepHTML(s, i) {
  const P = app.P, ss = P.steps[i];
  const open = (i === P.cur && ss.status !== 'pending') || ss.open;
  const num = ss.status === 'ok' ? '✓' : ss.status === 'bad' ? '✗' : i + 1;
  let inner = '';
  if (open) {
    inner += `<div class="think"><span class="bulb">${I.bulb}</span><span>${R(s.think)}</span></div>`;
    const finished = ss.status === 'ok' || ss.status === 'bad';
    if (s.pic && P.p.pic) inner += UI.impPic(P.p);
    if (s.check && !finished) inner += checkHTML(s, i);
    if (ss.fb) inner += `<div class="feedback ${ss.fb.kind}"><span class="mark">${ss.fb.kind === 'good' ? '✓' : ss.fb.kind === 'bad' ? '✗' : '•'}</span><span>${ss.fb.html}</span></div>`;
    if (!s.check || finished) {
      if (s.triangle || (s.tag === 'triangle' && P.p.triangle)) inner += `<div class="viz">${UI.triangle({ ...P.p.triangle, hi: [] })}</div>`;
      inner += `<div class="math-lines">${s.lines.map((l) => T(l, true)).join('')}</div>`;
      if (ss.status !== 'pending' && i === P.cur) {
        inner += `<div class="row"><button class="btn accent" data-act="stepNext">${i === P.p.steps.length - 1 ? 'See my score' : 'Next step'} ${I.next}</button><button class="tbtn" data-act="readStep" data-i="${i}">${I.speaker} Read step</button>${UI.askAvailable ? `<button class="tbtn" data-act="askStep" data-i="${i}">${I.ask} I have a question</button>` : ''}</div>`;
      }
    }
  }
  return `<div class="step ${ss.status}" id="step${i}"><div class="step-head" ${i < P.cur || (P.done && ss.status !== 'pending') ? `data-act="toggleStep" data-i="${i}" style="cursor:pointer" title="Show or hide this step"` : ''}><span class="step-n">${num}</span><span class="step-title">${R(s.title)}</span><span class="pts">${ptsLabel(s, ss)}</span></div>${open ? `<div class="step-body">${inner}</div>` : ''}</div>`;
}
function checkHTML(s, i) {
  const c = s.check, ss = app.P.steps[i];
  if (c.kind === 'choice') {
    return `<div class="prompt">${R(c.prompt)}</div><div class="opts">${ss.order.map((k, j) => { const o = c.options[k]; const st2 = ss.picked && ss.picked.includes(k) ? (o.ok ? 'right' : 'wrong') : ''; return `<button class="opt ${st2}" data-act="pick" data-i="${i}" data-k="${k}" ${ss.picked && ss.picked.includes(k) ? 'disabled' : ''}><span class="key">${'ABCD'[j]}</span><span>${o.tex ? T(o.tex) : R(o.text)}</span></button>`; }).join('')}</div>`;
  }
  if (c.kind === 'expr') return `${UI.mathField('mf' + i, { vars: c.vars, pre: c.promptTex, post: c.suffixTex || '' })}<div class="row"><button class="btn accent" data-act="checkStep" data-i="${i}">Check ${I.check}</button><button class="btn ghost" data-act="showStep" data-i="${i}">Show me</button></div>`;
  if (c.kind === 'num') return `${UI.mathField('mf' + i, { vars: [], pre: c.promptTex, placeholder: 'Type a number' })}<div class="row"><button class="btn accent" data-act="checkStep" data-i="${i}">Check ${I.check}</button><button class="btn ghost" data-act="showStep" data-i="${i}">Show me</button></div>`;
  if (c.kind === 'final') return `<div class="prompt">Final answer</div>${UI.mathField('mf' + i, { vars: ['x'], pre: app.P.p.tex + ' =', placeholder: 'Type the antiderivative (don\'t forget +C)' })}<div class="row"><button class="btn accent" data-act="checkStep" data-i="${i}">Check ${I.check}</button><button class="btn ghost" data-act="showStep" data-i="${i}">Show me</button></div>`;
  if (c.kind === 'improper') return `${c.final ? '<div class="prompt">Final answer: a number, or diverges</div>' : ''}${UI.mathField('mf' + i, { vars: [], improper: true, pre: c.promptTex, placeholder: 'A number, or type diverges' })}<div class="row"><button class="btn accent" data-act="checkStep" data-i="${i}">Check ${I.check}</button><button class="btn ghost" data-act="showStep" data-i="${i}">Show me</button></div>`;
  return '';
}
function wireStep(i) {
  const s = app.P.p.steps[i];
  if (s.check && ['expr', 'num', 'final', 'improper'].includes(s.check.kind)) {
    UI.wireMathField('mf' + i, () => ACT.checkStep({ dataset: { i: String(i) } }), app.P.steps[i].input || '');
  }
}
function rerenderStep(i, scroll) {
  const el = document.getElementById('step' + i); if (!el) return renderWork();
  el.outerHTML = stepHTML(app.P.p.steps[i], i);
  if (app.P.steps[i].status === 'current') wireStep(i);
  if (scroll) { const n = document.getElementById('step' + i); n && n.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); }
}
function finishStep(i, ok, pts, fbKind, fbHtml, tag, short) {
  const ss = app.P.steps[i];
  ss.status = ok ? 'ok' : 'bad'; ss.pts = pts; ss.fb = { kind: fbKind, html: fbHtml }; ss.short = short || ''; if (!ok) ss.tag = tag || app.P.p.steps[i].tag;
  UI.Sound.play(ok ? 'good' : 'bad');
  rerenderStep(i, true);
}
ACT.pick = (el) => {
  const i = +el.dataset.i, k = +el.dataset.k; const P = app.P; const s = P.p.steps[i], ss = P.steps[i], c = s.check, o = c.options[k];
  if (ss.status !== 'current') return;
  ss.picked = (ss.picked || []).concat(k); ss.tries++;
  if (o.ok) return finishStep(i, ss.tries === 1, ss.tries === 1 ? c.points : Math.floor(c.points / 2), ss.tries === 1 ? 'good' : 'info', ss.tries === 1 ? 'Yes!' : 'Got it on the second try (half credit).', null, ss.tries === 1 ? '' : 'second try, half credit');
  const maxTries = c.options.length <= 2 ? 1 : 2;
  if (ss.tries >= maxTries) {
    const right = c.options.find((x) => x.ok);
    return finishStep(i, false, 0, 'bad', `${R(o.msg || 'Not this one.')}<br>Correct: ${right.tex ? T(right.tex) : R(right.text)}`, s.tag, R(o.msg || 'picked the wrong option'));
  }
  ss.fb = { kind: 'bad', html: `${R(o.msg || 'Not this one.')} Try again.` };
  UI.Sound.play('bad');
  rerenderStep(i);
};
ACT.checkStep = (el) => {
  const i = +el.dataset.i; const P = app.P; const s = P.p.steps[i], ss = P.steps[i], c = s.check;
  if (ss.status !== 'current') return;
  const inp = document.getElementById('mf' + i + '-in'); const val = inp ? inp.value : '';
  ss.input = val;
  if (!val.trim()) { UI.toast('Type something first (or tap "Show me").'); return; }
  let res;
  if (c.kind === 'expr') res = M.checkStepExpr(val, c);
  else if (c.kind === 'num') { const r = M.checkNumber(val, c.expect); res = { ok: r.ok, invalid: r.invalid, msg: r.msg, approx: r.approx }; if (r.ok && r.approx) res.approxNote = true; }
  else if (c.kind === 'improper') { const r = M.checkImproper(val, c); res = { ok: r.ok, invalid: r.invalid, msg: r.msg, tag: r.tag }; if (r.ok && r.approx) res.approxNote = true; }
  else if (c.kind === 'final') {
    const g = M.gradeAntiderivative(val, P.p, c.points);
    if (g.verdict === 'invalid') res = { ok: false, invalid: true, msg: g.notes[0] && g.notes[0].text };
    else if (g.verdict === 'correct') res = { ok: true };
    else if (g.verdict === 'almost') res = { ok: true, almost: g, msg: g.notes.filter((n) => !n.ok).map((n) => n.text).join(' ') };
    else res = { ok: false, msg: g.diagnosis ? g.diagnosis.msg : null, tag: g.diagnosis && g.diagnosis.tag, grade: g };
  }
  if (res.invalid) { ss.fb = { kind: 'info', html: UI.esc(res.msg || 'I could not read that yet.') }; rerenderStep(i); return; }
  ss.tries++;
  if (res.ok) {
    let pts = ss.tries === 1 ? c.points : Math.floor(c.points / 2);
    let html = ss.tries === 1 ? pickPraise() : 'Got it on the second try (half credit).';
    if (res.approxNote && s.check.exactNote) { pts = Math.max(0, pts - 1); html += ` But keep it exact: ${T(c.answerTex)} (−1).`; ss.tag = 'exact'; }
    if (res.almost) { pts = Math.max(0, pts - (c.points - res.almost.score)); html = `Right antiderivative, but: ${R(res.msg)}`; ss.extraTags = res.almost.tags; }
    return finishStep(i, true, pts, pts === c.points ? 'good' : 'info', html, null, pts === c.points ? '' : ss.tries > 1 ? 'second try, half credit' : res.almost ? R(res.msg) : 'keep it exact');
  }
  if (ss.tries >= 2) {
    const ans = c.kind === 'final' ? P.p.answer.tex + ' + C' : c.answerTex;
    return finishStep(i, false, 0, 'bad', `${res.msg ? R(res.msg) + '<br>' : ''}The answer: ${T(ans)}`, res.tag || s.tag, res.msg ? R(res.msg) : 'missed it twice');
  }
  ss.fb = { kind: 'bad', html: `${res.msg ? R(res.msg) : 'Not quite.'} Try once more.` };
  UI.Sound.play('bad');
  rerenderStep(i);
  const n = document.getElementById('step' + i); if (n) n.classList.add('shake');
};
ACT.showStep = (el) => {
  const i = +el.dataset.i; const P = app.P; const s = P.p.steps[i], c = s.check;
  const ans = c.kind === 'final' ? P.p.answer.tex + ' + C' : c.answerTex;
  finishStep(i, false, 0, 'info', `Here it is: ${T(ans)}. Read the step below, then keep going.`, s.tag, 'peeked at the answer');
};
ACT.stepNext = () => {
  const P = app.P;
  if (P.cur < P.p.steps.length - 1) {
    P.cur++; P.steps[P.cur].status = 'current';
    rerenderStep(P.cur - 1); rerenderStep(P.cur, true);
    if (!P.p.steps[P.cur].check) { /* info step */ }
  } else finishProblem();
};
ACT.toggleStep = (el) => { const i = +el.dataset.i; const ss = app.P.steps[i]; ss.open = !ss.open; rerenderStep(i); };
ACT.readStep = (el) => { const s = app.P.p.steps[+el.dataset.i]; UI.Voice.say(UI.speakText(s.title) + '. ' + UI.speakText(s.think) + '. ' + s.lines.map((l) => M.speak(l)).join('. ')); };
ACT.askStep = (el) => { UI.openAsk && UI.openAsk({ step: +el.dataset.i }); };
const PRAISE = ['Yes!', 'Nailed it.', 'Clean.', 'Exactly right.', 'That is it.', 'Perfect.'];
const pickPraise = () => PRAISE[Math.floor(Math.random() * PRAISE.length)];

/* ---------- test mode ---------- */
function renderTestInput(work) {
  const P = app.P, p = P.p;
  if (P.result) { work.innerHTML = ''; return; }
  const def = isValue(p);
  work.innerHTML = `<div class="card pad stack"><div class="prompt">${p.improper ? 'Your answer: the value it converges to, or diverges' : def ? 'Your answer (exact value)' : 'Your answer'}</div>
    ${UI.mathField('mfT', fieldOpts(p, { btn: 'Submit', ...(def ? {} : { placeholder: 'Antiderivative + C' }) }))}
    <div class="row"><button class="btn accent" data-act="submitTest">Submit ${I.check}</button><button class="btn ghost" data-act="giveUp">Show me the steps</button></div></div>`;
  UI.wireMathField('mfT', () => ACT.submitTest(), P.testInput || '');
}
/** Grade one typed final answer (antiderivative or exact value) like a professor. */
function gradeTyped(p, input) {
  const v = String(input || '').trim();
  if (!v) return { verdict: 'blank', score: 0, outOf: p.outOf, notes: [{ ok: false, text: 'Left blank.' }], tags: [] };
  if (p.improper) {
    const g = M.gradeImproper(v, p, p.outOf);
    if (g.verdict === 'invalid') return { ...g, notes: [{ ok: false, text: `I couldn't read this one: ${g.error}` }] };
    return g;
  }
  if (p.definite) {
    const r = M.checkNumber(v, p.definite.value);
    if (r.invalid) return { verdict: 'invalid', score: 0, outOf: p.outOf, notes: [{ ok: false, text: `I couldn't read this one: ${r.msg || 'check the typing'}` }], tags: [], error: r.msg };
    if (r.ok && !r.approx) return { verdict: 'correct', score: p.outOf, outOf: p.outOf, notes: [{ ok: true, text: 'Exact and correct.' }], tags: [] };
    if (r.ok) return { verdict: 'almost', score: p.outOf - 1, outOf: p.outOf, notes: [{ ok: true, text: 'The value is right.' }, { ok: false, text: `Keep it exact: $${p.definite.exact}$ (−1).` }], tags: ['exact'] };
    let diag = null;
    for (const m of p.mistakes) { const mv = m.f(p.definite.hi[1]) - m.f(p.definite.lo[1]); if (Number.isFinite(mv) && Number.isFinite(r.value) && Math.abs(mv - r.value) < 1e-6 * Math.max(1, Math.abs(mv))) { diag = { tag: m.tag, msg: m.msg, step: m.step }; break; } }
    return { verdict: 'wrong', score: 0, outOf: p.outOf, notes: [{ ok: false, text: `That evaluates to ${Number.isFinite(r.value) ? r.value.toFixed(4) : '?'}; the answer is $${p.definite.exact}$.` }], diagnosis: diag, tags: diag ? [diag.tag] : [] };
  }
  const g = M.gradeAntiderivative(v, p, p.outOf);
  if (g.verdict === 'invalid') { const msg = (g.notes[0] && g.notes[0].text) || 'check the typing'; return { ...g, notes: [{ ok: false, text: `I couldn't read this one: ${msg}` }], tags: [], error: msg }; }
  return g;
}
ACT.submitTest = () => {
  const P = app.P, p = P.p; const v = (document.getElementById('mfT-in') || {}).value || '';
  if (!v.trim()) { UI.toast('Type your answer first.'); return; }
  P.testInput = v;
  const g = gradeTyped(p, v);
  if (g.verdict === 'invalid') { UI.toast(UI.esc(g.error || 'I could not read that.')); return; }
  P.result = { kind: 'test', g }; P.done = true;
  record(P, g.score, g.outOf, g.tags || []);
  renderWork(); renderResult();
};
ACT.giveUp = () => {
  const P = app.P; P.testInput = (document.getElementById('mfT-in') || {}).value || '';
  P.result = { kind: 'test', g: { verdict: 'gave', score: 0, outOf: P.p.outOf, notes: [{ ok: false, text: 'No worries. Walk through the steps, then lock it in with new numbers.' }], tags: [] } };
  P.done = true; P.solShown = 1;
  record(P, 0, P.p.outOf, []);
  renderWork(); renderResult();
};

/* ---------- finishing + scoring ---------- */
function finishProblem() {
  const P = app.P; const p = P.p;
  const score = P.steps.reduce((s, x) => s + (x.pts || 0), 0);
  const tags = [];
  P.steps.forEach((x) => { if (x.status === 'bad' && x.tag) tags.push(x.tag); if (x.tag === 'exact') tags.push('exact'); (x.extraTags || []).forEach((t) => tags.push(t)); });
  P.result = { kind: 'steps', score, outOf: p.outOf };
  P.done = true;
  record(P, score, p.outOf, [...new Set(tags)]);
  renderResult();
}
function record(P, score, outOf, tags) {
  const s = st(); const u = s.units[P.unit]; const frac = outOf ? score / outOf : 0;
  const level = P.p.level || 1;
  let d;
  if (P.mode === 'test') d = frac >= 0.999 ? (level >= 3 ? 26 : 22) : frac >= 0.9 ? 15 : frac >= 0.5 ? 3 : -6;
  else d = frac >= 0.999 ? 14 : frac >= 0.75 ? 8 : frac >= 0.5 ? 3 : -4;
  if (d > 0 && P.hints) d = P.mode === 'test' ? Math.max(3, Math.round(d * (1 - P.hints / P.p.steps.length))) : Math.max(3, d - 4 * P.hints);
  if (P.result && P.result.g && P.result.g.verdict === 'gave') d = 0;
  const before = u.mastery;
  u.mastery = Math.max(0, Math.min(100, u.mastery + d));
  u.attempts++; if (frac >= 0.999) u.perfect++; if (frac >= 0.5) u.solved++;
  const combo = frac >= 0.999 ? s.combo + 1 : 0;
  s.combo = combo; s.bestCombo = Math.max(s.bestCombo, combo);
  const xp = Math.round(score * 2 + (frac >= 0.999 ? 6 + Math.min(combo, 10) * 2 : 0));
  s.xp += xp;
  for (const t of tags) if (t) s.traps[t] = (s.traps[t] || 0) + 1;
  if (P.guide) { const gk = `${P.unit}/${P.guide.sc}`; const g = (s.guide[gk] = s.guide[gk] || { n: 0, ok: 0 }); g.n++; if (frac >= 0.999) g.ok++; }
  s.history.push({ u: P.unit, f: P.p.family, s: score, o: outOf, m: P.mode, t: Date.now() });
  if (s.history.length > 90) s.history = s.history.slice(-90);
  markDay();
  Store.save();
  checkGoal();
  P.delta = { mastery: u.mastery - before, xp, combo };
  header();
  if (frac >= 0.999) { UI.Sound.play('good'); UI.confetti(combo >= 3 ? 160 : 90); }
  if (before < 100 && u.mastery >= 100) setTimeout(() => celebrate('Boss Quiz unlocked', `You hit 100% mastery in ${M.unit(P.unit).name}. Beat the boss quiz (7 of 8) to unlock the next section.`, 'quiz'), 700);
}
function stampClass(f) { return f >= 0.9 ? 'good' : f >= 0.6 ? 'mid' : 'bad'; }
function renderResult() {
  const P = app.P, p = P.p, box = document.getElementById('resultBox'); if (!box || !P.result) return;
  const res = P.result;
  const score = res.kind === 'steps' ? res.score : res.g.score, outOf = res.kind === 'steps' ? res.outOf : res.g.outOf;
  const f = outOf ? score / outOf : 0;
  const headline = res.g && res.g.verdict === 'gave' ? 'Let\'s walk through it.' : f >= 0.999 ? 'Full credit.' : f >= 0.85 ? 'So close, one slip.' : f >= 0.5 ? 'Partial credit. Let\'s patch it.' : 'Not yet. Here\'s exactly where it broke.';
  let notes = '';
  let missStep = null;
  if (res.kind === 'steps') {
    notes = p.steps.map((s, i) => { const ss = P.steps[i]; if (!s.check) return ''; const ok = ss.status === 'ok' && ss.pts === s.check.points; if (!ok && missStep == null) missStep = i; return `<div class="note ${ok ? 'ok' : 'no'}"><span class="m">${ok ? '✓' : '✗'}</span><span><b>Step ${i + 1}:</b> ${R(s.title)} <span class="muted tnum">(${ss.pts}/${s.check.points})</span>${!ok && ss.short ? ` — ${ss.short}` : ''}</span></div>`; }).join('');
  } else {
    notes = (res.g.notes || []).map((n) => `<div class="note ${n.ok ? 'ok' : 'no'}"><span class="m">${n.ok ? '✓' : '✗'}</span><span>${R(n.text)}</span></div>`).join('');
    if (res.g.diagnosis && res.g.diagnosis.step != null) missStep = res.g.diagnosis.step;
  }
  const diag = res.kind === 'steps'
    ? (missStep != null ? { step: missStep, msg: P.steps[missStep].fb ? P.steps[missStep].fb.html : '', tag: P.steps[missStep].tag } : null)
    : res.g.diagnosis;
  const trap = diag && diag.tag && M.TRAPS[diag.tag];
  const delta = P.delta || { mastery: 0, xp: 0 };
  box.innerHTML = `<div class="result" id="result">
    <span class="delta">+${delta.xp} XP${delta.mastery ? ` · mastery ${delta.mastery > 0 ? '+' : ''}${delta.mastery}%` : ''}</span>
    <div class="result-top"><div class="stamp ${stampClass(f)}"><div><div class="big">${score}/${outOf}</div><div class="small">${UI.letter(f)}</div></div></div>
      <div><h2>${headline}</h2>${delta.combo >= 2 ? `<div class="combo">${delta.combo} in a row!</div>` : ''}</div></div>
    <div class="notes">${notes}</div>
    ${diag && (diag.msg || diag.step != null) && f < 0.999 ? `<div class="diag"><div class="t">${diag.step != null ? `This is where it went wrong: Step ${diag.step + 1} — ${UI.esc(p.steps[diag.step].title)}` : 'What went wrong'}</div>${res.kind === 'test' && diag.msg ? `<div>${R(diag.msg)}</div>` : ''}${trap ? `<div><b>Patch:</b> ${R(trap.patch)}</div>` : ''}</div>` : ''}
    <div class="row">
      ${f < 0.999 ? `<button class="btn accent" data-act="twin">${I.reset} Lock it in: same type, new numbers</button>` : `<button class="btn accent" data-act="nextProblem">Next problem ${I.next}</button>`}
      ${f < 0.999 ? `<button class="btn soft" data-act="nextProblem">Different problem</button>` : `<button class="btn soft" data-act="twin">Same type again</button>`}
      ${res.kind === 'test' && f < 0.999 && res.g.verdict !== 'gave' ? `<button class="btn ghost" data-act="retrySame">Try this one again</button>` : ''}
      ${P.guide ? `<button class="btn ghost" data-act="gReturn">${I.list} Back to the step list</button>` : ''}
    </div>
    ${res.kind === 'test' ? `<div class="solution" id="sol"></div>` : `<button class="btn ghost sm" data-act="toggleSol">${P.solAll ? 'Hide' : 'Show'} the full worked solution</button><div class="solution" id="sol"></div>`}
  </div>`;
  P.missStep = diag ? diag.step : null;
  renderSolution();
  if (st().settings.autoRead) UI.Voice.say(`${score} out of ${outOf}. ${headline}`);
  setTimeout(() => { const r = document.getElementById('result'); r && r.scrollIntoView({ behavior: 'smooth', block: 'start' }); }, 60);
}
function renderSolution() {
  const P = app.P, p = P.p, el = document.getElementById('sol'); if (!el) return;
  if (P.result.kind === 'steps' && !P.solAll) { el.innerHTML = ''; return; }
  const n = P.result.kind === 'steps' || P.solAll ? p.steps.length : Math.max(P.solShown, P.result.g.verdict === 'correct' ? 0 : 1);
  const head = P.result.kind === 'test' ? `<div class="row between"><span class="eyebrow">Full worked solution</span><div class="row"><button class="btn sm soft" data-act="solNext" ${n >= p.steps.length ? 'disabled' : ''}>${n ? 'Next step' : 'Show step 1'} ${I.next}</button><button class="btn sm ghost" data-act="solAll">Show all</button></div></div>` : '';
  el.innerHTML = head + solStepsHTML(p, P.missStep, n);
}
/** The full worked solution, with the step where it went wrong circled. */
function solStepsHTML(p, missStep, n = p.steps.length) {
  return p.steps.slice(0, n).map((s, i) => {
    const ans = s.check && s.check.kind === 'choice' ? (() => { const o = s.check.options.find((x) => x.ok); return o.tex ? T(o.tex) : R(o.text); })() : '';
    return `<div class="sol-step ${missStep === i ? 'miss' : ''}"><h4><span class="n">${i + 1}</span>${R(s.title)}${missStep === i ? ' <span class="hand" style="color:var(--bad);font-size:20px">← went wrong here</span>' : ''}</h4>
      <div class="think"><span class="bulb">${I.bulb}</span><span>${R(s.think)}</span></div>
      ${s.tag === 'triangle' && p.triangle ? `<div class="viz">${UI.triangle({ ...p.triangle })}</div>` : ''}
      ${s.pic && p.pic ? UI.impPic(p) : ''}
      <div class="math-lines">${s.lines.map((l) => T(l, true)).join('')}</div>
      ${ans ? `<div class="muted" style="font-size:14px">Answer: ${ans}</div>` : ''}</div>`;
  }).join('');
}
ACT.solNext = () => { const P = app.P; P.solShown = Math.min(P.p.steps.length, (P.solShown || (P.result.g.verdict === 'correct' ? 0 : 1)) + 1); renderSolution(); const last = document.querySelector('#sol .sol-step:last-child'); last && last.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); };
ACT.solAll = () => { app.P.solAll = true; app.P.solShown = app.P.p.steps.length; renderSolution(); };
ACT.toggleSol = (el) => { app.P.solAll = !app.P.solAll; el.textContent = (app.P.solAll ? 'Hide' : 'Show') + ' the full worked solution'; renderSolution(); };

/* ================= QUIZ SET (nothing checked until the end) ================= */
const SET_GAIN = { 1: 12, 2: 18, 3: 24 }; // mastery for a full-credit problem, by level
/** Levels for a new set: easier first, harder as mastery grows. */
function setLevels(unitKey, n) {
  const u = st().units[unitKey];
  if (u.levelPin) return Array(n).fill(u.levelPin);
  const base = u.mastery < 35 ? [1, 1, 1, 2, 2] : u.mastery < 70 ? [1, 2, 2, 2, 3] : [2, 2, 3, 3, 3];
  return Array.from({ length: n }, (_, i) => base[Math.floor((i * base.length) / n)]);
}
function makeItem(unitKey, level, family, used) {
  let item = null;
  for (let t = 0; t < 10; t++) {
    const seed = (Math.random() * 4294967296) >>> 0;
    const p = M.generate(unitKey, level, M.rng(seed), family || undefined);
    item = { seed, level, family: family || null, p, tex: p.tex, ans: '', hints: 0 };
    if (!used.has(p.tex) && (family || !used.has(p.family) || t >= 6)) break;
  }
  used.add(item.p.family); used.add(item.p.tex);
  return item;
}
/** spec: optional [{level, family}] for a redo set */
function newSet(unitKey, spec, kind) {
  const used = new Set();
  const plan = spec && spec.length ? spec : setLevels(unitKey, st().settings.setSize || 5).map((level) => ({ level, family: null }));
  const k = kind || (spec && spec.length ? 'redo' : 'set');
  return { unit: unitKey, items: plan.map((x) => makeItem(unitKey, x.level, x.family, used)), i: 0, stage: 'work', t0: Date.now(), act: 0, kind: k, redo: k === 'redo' };
}
function saveSet(unitKey) {
  const S = app.SET[unitKey];
  if (!S || S.stage === 'report') delete st().sets[unitKey];
  else st().sets[unitKey] = { i: S.i, t0: S.t0, act: S.act || 0, redo: S.redo, kind: S.kind || 'set', stage: S.stage, items: S.items.map((it) => ({ seed: it.seed, level: it.level, family: it.family, tex: it.tex, ans: it.ans, hints: it.hints })) };
  Store.save();
}
/** Rebuild an unfinished set from its seeds (so a reload or another device picks up where you left off). */
function restoreSet(unitKey) {
  const saved = st().sets && st().sets[unitKey];
  if (!saved || !Array.isArray(saved.items) || !saved.items.length) return null;
  try {
    const items = saved.items.map((it) => {
      const p = M.generate(unitKey, it.level, M.rng(it.seed), it.family || undefined);
      if (p.tex !== it.tex) throw new Error('changed');
      return { seed: it.seed, level: it.level, family: it.family || null, p, tex: it.tex, ans: String(it.ans || ''), hints: +it.hints || 0 };
    });
    const t0 = saved.t0 || Date.now();
    // sets saved before active time existed: wall time, capped so an overnight gap doesn't count
    const act = saved.act != null ? Math.max(0, +saved.act || 0) : Math.min(10 * 60000, Math.max(0, Date.now() - t0));
    return { unit: unitKey, items, i: Math.max(0, Math.min(items.length - 1, saved.i || 0)), stage: saved.stage === 'review' ? 'review' : 'work', t0, act, redo: !!saved.redo, kind: saved.kind || (saved.redo ? 'redo' : 'set') };
  } catch (e) { delete st().sets[unitKey]; return null; }
}
let setSaveTimer = 0;
const queueSetSave = (k) => { clearTimeout(setSaveTimer); setSaveTimer = setTimeout(() => saveSet(k), 600); };
const curSet = () => app.SET[app.route.unit];
function captureAns(S) { const inp = document.getElementById('mfS-in'); if (inp && S.stage === 'work') S.items[S.i].ans = inp.value; }
function syncDots(S) {
  document.querySelectorAll('.numnav [data-k]').forEach((b) => { const x = S.items[+b.dataset.k]; if (x) b.classList.toggle('done', !!x.ans.trim()); });
  const c = document.getElementById('setCount'); if (c) c.textContent = toGo(S.items.filter((x) => x.ans.trim()).length, S.items.length);
  const cta = document.getElementById('setCta'); if (cta) cta.innerHTML = reviewCta(S);
  const nb = document.getElementById('setNext'); if (nb && S.i < S.items.length - 1) nb.innerHTML = `${S.items[S.i].ans.trim() ? 'Next problem' : 'Skip for now'} ${I.next}`;
}
function popDot(k) { const b = document.querySelector(`.numnav [data-k="${k}"]`); if (b) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); } }
function scrollToProblem() {
  const card = document.querySelector('.problem-card'); if (!card) return;
  const bar = document.querySelector('.topbar'); const off = (bar ? bar.getBoundingClientRect().height : 0) + 12;
  G.scrollTo({ top: Math.max(0, card.getBoundingClientRect().top + G.scrollY - off - 64), behavior: 'smooth' });
}
const toGo = (done, n) => (done >= n ? 'All answered ✓' : done ? `${done} down, ${n - done} to go` : `${n} to go`);
const numNav = (flags, cur, act, label, cta = '') => `<div class="numnav" role="group" aria-label="${label}">${flags.map((done, k) => `<button class="${k === cur ? 'cur' : ''}${done ? ' done' : ''}" data-act="${act}" data-k="${k}" aria-label="${k + 1}${done ? ', answered' : ''}"${k === cur ? ' aria-current="step"' : ''}>${k + 1}</button>`).join('')}<span class="numnav-note tnum" id="setCount">${toGo(flags.filter(Boolean).length, flags.length)}</span>${cta}</div>`;
const reviewCta = (S) => (S.items.every((x) => x.ans.trim()) && S.i < S.items.length - 1 ? `<button class="btn sm accent" data-act="setReview">Review and grade ${I.next}</button>` : '');

function renderSet(body, u) {
  let S = app.SET[u.key];
  if (!S) S = app.SET[u.key] = restoreSet(u.key) || newSet(u.key);
  if (S.stage === 'review') return renderSetReview(body, u, S);
  if (S.stage === 'report') return renderSetReport(body, u, S);
  const it = S.items[S.i], p = it.p, n = S.items.length, last = S.i === n - 1;
  const focus = document.body.classList.contains('focus');
  const kindLabel = S.kind === 'one' ? 'Quick one' : S.redo ? 'Redo set' : 'Quiz set';
  body.innerHTML = `<div class="practice${focus ? ' focus-practice' : ''}">
    ${focus ? '' : modeBar(u, 'set', n)}
    ${numNav(S.items.map((x) => !!x.ans.trim()), S.i, 'setJump', 'Problems in this set', `<span id="setCta">${reviewCta(S)}</span>`)}
    <div class="problem-card">
      ${focus ? '' : `<div class="meta"><span class="eyebrow">${kindLabel} · Problem ${S.i + 1} of ${n}</span><span class="tag-fam">Level ${it.level}</span></div>`}
      <div class="integral">${T(p.tex, true)}</div>
      <div class="tool-row">
        <button class="tbtn" data-act="setRead">${I.speaker} Read it</button>
        <button class="tbtn" data-act="stepList">${I.list} Step list</button>
        <button class="tbtn" data-act="setHint" ${it.hints >= p.steps.length ? 'disabled' : ''}>${I.bulb} ${peekLabel(it.hints, p.steps.length)}</button>
        <button class="tbtn" data-act="setAsk">${I.ask} Ask Claude</button>
      </div>
    </div>
    <div class="peek" id="peek">${peekHTML(p, it.hints, it.peekOpen)}</div>
    <div class="card pad stack answer-card">
      ${focus ? '' : `<div class="prompt">${p.improper ? 'Your answer: what it converges to, or diverges' : p.definite ? 'Your answer (exact value)' : 'Your final answer'}</div>`}
      ${UI.mathField('mfS', fieldOpts(p, { btn: last ? 'Review' : 'Next' }))}
      <div class="row between">
        <button class="btn ghost" data-act="setNav" data-d="-1" ${S.i === 0 ? 'disabled' : ''}>${I.back} Back</button>
        ${last ? `<button class="btn accent" data-act="setReview">Review and grade ${I.check}</button>` : `<button class="btn accent" id="setNext" data-act="setNav" data-d="1">${it.ans.trim() ? 'Next problem' : 'Skip for now'} ${I.next}</button>`}
      </div>
    </div>
    ${focus ? '' : `<p class="mode-note" style="text-align:center">Stuck? Skip it and keep going. You'll get the full steps for it at the end.</p>`}
  </div>`;
  const f = UI.wireMathField('mfS', () => (last ? ACT.setReview() : ACT.setNav({ dataset: { d: '1' } })), it.ans, (v) => { if (v !== it.ans) { it.ans = v; syncDots(S); queueSetSave(u.key); } });
  if (f && !(G.matchMedia && G.matchMedia('(pointer: coarse)').matches)) f.input.focus({ preventScroll: true });
  if (st().settings.autoRead && !it.spoken) { it.spoken = true; setTimeout(() => UI.Voice.say(p.speech), 250); }
}
function renderSetReview(body, u, S) {
  const n = S.items.length;
  let blanks = 0, unreadable = 0;
  const rows = S.items.map((it, k) => {
    const a = it.ans.trim(); let cls = '', ans;
    if (!a) { blanks++; cls = 'blank'; ans = '<span class="muted">Blank. It counts as 0, but you still get the steps.</span>'; }
    else {
      const r = readTyped(it.p, a);
      if (r.ok) ans = T(r.tex);
      else { unreadable++; cls = 'err'; ans = `${r.tex ? T(r.tex) + ' ' : ''}<span class="err-t">${UI.esc(r.error || 'I can\'t read this yet.')}</span>`; }
    }
    return `<button class="set-row ${cls}" data-act="setJump" data-k="${k}"><span class="sn">${k + 1}</span><span class="sbody"><span class="sq">${T(it.p.tex)}</span><span class="sa">${ans}</span></span><span class="se">Edit</span></button>`;
  }).join('');
  const firstOpen = Math.max(0, S.items.findIndex((it) => !it.ans.trim()));
  body.innerHTML = `<div class="practice">
    ${modeBar(u, 'set', n)}
    <div class="card pad stack">
      <div><div class="eyebrow">Ready to turn it in?</div><h2 class="h-display">Check your answers</h2>
        <p class="muted" style="margin-top:4px">${n - blanks} of ${n} answered${blanks ? ` · ${blanks} blank` : ''}${unreadable ? ` · ${unreadable} need${unreadable > 1 ? '' : 's'} a typing fix` : ''}. Tap any problem to change it.</p></div>
      <div class="set-list">${rows}</div>
      <div class="row"><button class="btn accent" data-act="setGrade">${I.check} Grade my quiz</button><button class="btn soft" data-act="setJump" data-k="${blanks ? firstOpen : n - 1}">Keep working</button></div>
    </div></div>`;
}
function setResultHTML(r, k) {
  const { it, g } = r; const p = it.p;
  const f = g.outOf ? g.score / g.outOf : 0;
  const cls = f >= 0.999 ? 'ok' : f >= 0.5 ? 'part' : 'no';
  let yours = '<span class="muted">blank</span>';
  if (it.ans.trim()) { const pr = readTyped(p, it.ans); yours = pr.tex ? T(pr.tex) : `<span class="mono">${UI.esc(it.ans)}</span>`; }
  const right = answerTex(p);
  const diag = g.diagnosis; const trap = diag && diag.tag && M.TRAPS[diag.tag];
  const miss = f < 0.999;
  return `<div class="rev res ${miss ? cls : ''}" id="res${k}">
    <div class="row between"><b>${f >= 0.999 ? '✓' : f >= 0.5 ? '~' : '✗'} Problem ${k + 1}</b><span class="res-score ${cls}">${g.score}/${g.outOf}</span></div>
    <div class="tex">${T(p.tex, true)}</div>
    <div class="ans-line"><span class="eyebrow">yours</span><span>${yours}</span></div>
    ${miss ? `<div class="ans-line"><span class="eyebrow">answer</span><span>${T(right)}</span></div>` : '<div class="muted" style="font-size:14px">Full credit.</div>'}
    ${miss && g.notes && g.notes.length ? `<div class="notes">${g.notes.map((nt) => `<div class="note ${nt.ok ? 'ok' : 'no'}"><span class="m">${nt.ok ? '✓' : '✗'}</span><span>${R(nt.text)}</span></div>`).join('')}</div>` : ''}
    ${miss && diag && (diag.msg || diag.step != null) ? `<div class="diag"><div class="t">${diag.step != null && p.steps[diag.step] ? `Went wrong at Step ${diag.step + 1}: ${UI.esc(p.steps[diag.step].title)}` : 'What went wrong'}</div>${diag.msg ? `<div>${R(diag.msg)}</div>` : ''}${trap ? `<div><b>Patch:</b> ${R(trap.patch)}</div>` : ''}</div>` : ''}
    ${it.hints ? `<div class="muted" style="font-size:13.5px">You peeked at ${it.hints} of ${p.steps.length} steps.</div>` : ''}
    <div class="row"><button class="btn sm ${miss ? 'soft' : 'ghost'}" data-act="setSol" data-k="${k}">${r.open ? 'Hide' : 'Show'} the steps</button><button class="btn sm ghost" data-act="setAskRes" data-k="${k}">${I.ask} Ask Claude about this</button></div>
    ${r.open ? `<div class="solution">${solStepsHTML(p, diag ? diag.step : null)}</div>` : ''}
  </div>`;
}
function renderSetReport(body, u, S) {
  const rep = S.report; const f = rep.outOf ? rep.score / rep.outOf : 0;
  const n = S.results.length;
  const isMiss = (r) => r.g.score < r.g.outOf;
  const misses = S.results.filter(isMiss).length, full = n - misses;
  if (S.view == null || S.view >= n) { const fm = S.results.findIndex(isMiss); S.view = fm >= 0 ? fm : 0; }
  const us = st().units[u.key];
  const size = st().settings.setSize || 5;
  const mins = Math.round(rep.secs / 60);
  const headline = f >= 0.999 ? 'Perfect set.' : f >= 0.9 ? 'A-range work.' : f >= 0.75 ? 'Solid. Patch the misses.' : f >= 0.5 ? 'Partial credit. Here is what to fix.' : 'Not yet. Here is exactly where it broke.';
  const tiles = `<div class="tiles" role="group" aria-label="Your problems">${S.results.map((r, k) => {
    const rf = r.g.outOf ? r.g.score / r.g.outOf : 0; const cls = rf >= 0.999 ? 'ok' : rf >= 0.5 ? 'part' : 'no';
    return `<button class="tile ${cls}${!S.showAll && k === S.view ? ' on' : ''}" data-act="setView" data-k="${k}" aria-label="Problem ${k + 1}: ${r.g.score} out of ${r.g.outOf}"${!S.showAll && k === S.view ? ' aria-current="true"' : ''}><span class="tile-n">${k + 1}</span><span class="tile-m">${rf >= 0.999 ? '✓' : rf >= 0.5 ? '~' : '✗'}</span><span class="tile-s tnum">${r.g.score}/${r.g.outOf}</span></button>`;
  }).join('')}</div>`;
  // the next card to look at: the next miss after this one, else the next problem
  const nextMiss = S.results.findIndex((r, k) => k > S.view && isMiss(r));
  const nextK = nextMiss >= 0 ? nextMiss : S.view + 1 < n ? S.view + 1 : -1;
  const nav = `<div class="row between rev-nav">
      <button class="btn ghost" data-act="setView" data-k="${S.view - 1}" ${S.view === 0 ? 'disabled' : ''}>${I.back} Problem ${S.view}</button>
      ${nextK >= 0 ? `<button class="btn accent" data-act="setView" data-k="${nextK}">${nextMiss >= 0 ? 'Next miss' : 'Next problem'} ${I.next}</button>`
        : misses ? `<button class="btn accent" data-act="setRedo">${I.reset} Redo my misses</button>` : `<button class="btn accent" data-act="setNew">New quiz set ${I.next}</button>`}
    </div>`;
  body.innerHTML = `<div class="practice">
    ${modeBar(u, 'set', n)}
    <div class="result">
      <span class="delta">+${rep.xp} XP${rep.mastery ? ` · mastery ${rep.mastery > 0 ? '+' : ''}${rep.mastery}%` : ''}</span>
      <div class="result-top"><div class="stamp ${stampClass(f)}"><div><div class="big">${UI.letter(f)}</div><div class="small tnum">${rep.score}/${rep.outOf}</div></div></div>
        <div><h2>${headline}</h2><p class="muted" style="margin-top:4px">${full} of ${n} full credit · ${mins < 1 ? 'under a minute' : `${mins} min`}${misses ? ` · tap a box below to look at each one` : ''}</p></div></div>
      ${us.mastery >= 100 && !us.quizPassed ? `<div class="feedback good"><span class="mark">★</span><span>100% mastery. The Boss Quiz is unlocked. <button class="btn sm accent" data-act="goQuiz" style="margin-left:6px">Take the Boss Quiz</button></span></div>` : ''}
      <div class="row">
        ${misses ? `<button class="btn accent" data-act="setRedo">${I.reset} Redo my ${misses} miss${misses > 1 ? 'es' : ''} with new numbers</button>` : ''}
        <button class="btn ${misses ? 'soft' : 'accent'}" data-act="setNew">New quiz set ${I.next}</button>
        <div class="seg" role="group" aria-label="Problems per set"><button data-act="setSize" data-n="5" aria-pressed="${size === 5}">5</button><button data-act="setSize" data-n="10" aria-pressed="${size === 10}">10</button></div>
      </div>
      <div class="break-tip">${I.timer}<span>That was ${mins < 1 ? 'a quick one' : `${mins} minutes of focus`}. A short break helps it stick.</span><button class="btn sm soft" data-act="takeBreak">Start a 2-min break</button></div>
    </div>
    <div class="row between"><span class="eyebrow">${S.showAll ? 'All problems' : `Problem ${S.view + 1} of ${n}`}</span><button class="btn ghost sm" data-act="setShowAll">${S.showAll ? 'One at a time' : 'Show all at once'}</button></div>
    ${tiles}
    <div class="review">${S.showAll ? S.results.map(setResultHTML).join('') : setResultHTML(S.results[S.view], S.view) + nav}</div>
  </div>`;
}
ACT.setView = (el) => { const S = curSet(); if (!S || !S.results) return; const k = +el.dataset.k; if (k < 0 || k >= S.results.length) return; S.view = k; S.showAll = false; renderUnit(); const c = document.querySelector('.tiles'); if (c) { const bar = document.querySelector('.topbar'); G.scrollTo({ top: Math.max(0, c.getBoundingClientRect().top + G.scrollY - (bar ? bar.getBoundingClientRect().height : 0) - 16), behavior: 'smooth' }); } };
ACT.setShowAll = () => { const S = curSet(); if (!S || !S.results) return; S.showAll = !S.showAll; renderUnit(); };
/** confetti the first time today's problem count reaches the daily goal */
function checkGoal() {
  const s = st(), g = s.settings.goal || 10;
  if (todayCount() >= g && s.goalDay !== UI.today()) {
    s.goalDay = UI.today(); Store.save();
    setTimeout(() => { UI.toast(`<span class="big">Daily goal!</span> ${g} problems today. Everything else is a bonus.`, 5000); UI.confetti(160); UI.Sound.play('level'); }, 1400);
  }
}
function recordSet(S) {
  const s = st(); const u = s.units[S.unit]; const before = u.mastery;
  let xp = 0, score = 0, outOf = 0;
  for (const { it, g } of S.results) {
    const frac = g.outOf ? g.score / g.outOf : 0;
    score += g.score; outOf += g.outOf;
    const gain = SET_GAIN[it.level] || 12;
    let d = frac >= 0.999 ? gain : frac >= 0.9 ? Math.round(gain * 0.6) : frac >= 0.5 ? 2 : -5;
    if (d > 0 && it.hints) d = Math.max(2, Math.round(d * (1 - it.hints / it.p.steps.length)));
    u.mastery = Math.max(0, Math.min(100, u.mastery + d));
    u.attempts++; if (frac >= 0.999) u.perfect++; if (frac >= 0.5) u.solved++;
    s.combo = frac >= 0.999 ? s.combo + 1 : 0; s.bestCombo = Math.max(s.bestCombo, s.combo);
    xp += Math.round(g.score * 2 + (frac >= 0.999 ? 6 + Math.min(s.combo, 10) * 2 : 0));
    for (const t of new Set(g.tags || [])) if (t) s.traps[t] = (s.traps[t] || 0) + 1;
    s.history.push({ u: S.unit, f: it.p.family, s: g.score, o: g.outOf, m: 'set', t: Date.now() });
  }
  if (outOf && score === outOf) xp += 25;
  s.xp += xp;
  if (s.history.length > 90) s.history = s.history.slice(-90);
  markDay();
  delete s.sets[S.unit];
  Store.save();
  checkGoal();
  S.report = { score, outOf, xp, mastery: u.mastery - before, secs: Math.round((S.act || 0) / 1000) };
  header();
  const f = outOf ? score / outOf : 0;
  if (f >= 0.999) { UI.Sound.play('level'); UI.confetti(180); } else if (f >= 0.8) { UI.Sound.play('good'); UI.confetti(80); } else UI.Sound.play('chime');
  if (before < 100 && u.mastery >= 100 && !u.quizPassed) setTimeout(() => celebrate('Boss Quiz unlocked', `You hit 100% mastery in ${M.unit(S.unit).name}. Beat the boss quiz (7 of 8) to unlock the next section.`, 'quiz'), 900);
  if (st().settings.autoRead) UI.Voice.say(`${score} out of ${outOf}. ${UI.letter(f).replace('−', ' minus').replace('+', ' plus')}.`);
}
ACT.setNav = (el) => {
  const S = curSet(); if (!S) return; captureAns(S);
  const from = S.i, d = +el.dataset.d;
  S.i = Math.max(0, Math.min(S.items.length - 1, S.i + d)); saveSet(S.unit); renderUnit(); scrollToProblem();
  if (d > 0 && S.items[from].ans.trim()) { popDot(from); UI.Sound.play('tick'); }
};
ACT.setJump = (el) => { const S = curSet(); if (!S) return; captureAns(S); S.i = Math.max(0, Math.min(S.items.length - 1, +el.dataset.k)); S.stage = 'work'; saveSet(S.unit); renderUnit(); scrollToProblem(); };
ACT.setReview = () => { const S = curSet(); if (!S) return; captureAns(S); S.stage = 'review'; saveSet(S.unit); renderUnit(); G.scrollTo({ top: 0 }); };
ACT.setGrade = () => {
  const S = curSet(); if (!S || S.stage === 'report') return;
  captureAns(S); clearTimeout(setSaveTimer); app.askFocus = null;
  S.results = S.items.map((it) => ({ it, g: gradeTyped(it.p, it.ans), open: false }));
  S.stage = 'report'; S.view = null; S.showAll = false;
  recordSet(S);
  renderUnit(); G.scrollTo({ top: 0 });
};
ACT.setNew = () => { const k = app.route.unit; app.SET[k] = newSet(k); delete st().sets[k]; renderUnit(); G.scrollTo({ top: 0 }); };
ACT.setRedo = () => {
  const S = curSet(); if (!S || !S.results) return;
  const spec = S.results.filter((r) => r.g.score < r.g.outOf).map((r) => ({ level: r.it.level, family: r.it.p.family }));
  app.SET[S.unit] = newSet(S.unit, spec); renderUnit(); G.scrollTo({ top: 0 });
};
ACT.setSize = (el) => { st().settings.setSize = +el.dataset.n === 10 ? 10 : 5; Store.save(); renderUnit(); UI.toast(`Your next set will have ${st().settings.setSize} problems.`); };
ACT.setSol = (el) => { const S = curSet(); if (!S || !S.results) return; const r = S.results[+el.dataset.k]; r.open = !r.open; renderUnit(); };
ACT.setRead = () => { const S = curSet(); if (S && S.stage === 'work') UI.Voice.say(S.items[S.i].p.speech); };
ACT.setAsk = () => { const S = curSet(); if (!S) return; captureAns(S); app.askFocus = null; UI.openAsk && UI.openAsk({ mode: 'chat' }); };
ACT.setAskRes = (el) => { const S = curSet(); if (!S || !S.results) return; app.askFocus = { unit: S.unit, k: +el.dataset.k }; UI.openAsk && UI.openAsk({ mode: 'chat' }); };
ACT.setHint = () => {
  const S = curSet(); if (!S || S.stage !== 'work') return;
  captureAns(S);
  revealNext(S.items[S.i], () => saveSet(S.unit));
};

/* ================= BOSS QUIZ ================= */
function buildQuiz(units, levels) {
  const qs = []; const seen = new Set();
  levels.forEach((lv, i) => {
    const u = units[i % units.length];
    for (let t = 0; t < 12; t++) {
      const p = M.generate(u, lv, M.rng());
      if (p.noMC) continue;
      if (seen.has(p.family + p.tex) || (t < 6 && seen.has(u + p.family + lv))) continue;
      seen.add(p.family + p.tex); seen.add(u + p.family + lv);
      qs.push({ p, opts: M.makeMC(p), pick: null, unit: u }); break;
    }
  });
  return qs;
}
function renderQuiz(body, u, locked) {
  const Q = app.Q && app.Q.unit === u.key ? app.Q : null;
  const us = st().units[u.key];
  if (!Q || Q.stage === 'intro') {
    body.innerHTML = `<div class="quiz"><div class="card pad stack" style="text-align:center;align-items:center">
      <div class="eyebrow">Boss quiz · Section ${u.sec}</div>
      <div style="font-size:56px;line-height:1">${T(u.sample)}</div>
      <h2 style="font-family:var(--font-display);font-size:30px">Beat 7 of 8 to master ${UI.esc(u.short)}</h2>
      <p class="muted" style="max-width:54ch">Multiple choice, 8 questions. Work each one on paper (or the scratchpad), pick the matching answer, and change your picks anytime. Nothing is graded until you turn it in. The wrong choices are real mistakes students make, so check carefully.</p>
      ${locked ? `<div class="unavail">You are at ${us.mastery}% mastery. The quiz officially unlocks at 100%, but you can take it early: passing it still counts.</div>` : ''}
      ${us.quizBest != null ? `<div class="muted">Best so far: <b>${us.quizBest}/8</b></div>` : ''}
      <div class="row" style="justify-content:center"><button class="btn accent" data-act="startQuiz">${locked ? 'Take it early' : 'Start the boss quiz'} ${I.play}</button>${locked ? '<button class="btn soft" data-act="tab" data-tab="practice">Keep practicing</button>' : ''}</div></div></div>`;
    return;
  }
  if (Q.stage === 'q') {
    const q = Q.qs[Q.i], n = Q.qs.length;
    const blanks = Q.qs.filter((x) => x.pick == null).length;
    const firstBlank = Math.max(0, Q.qs.findIndex((x) => x.pick == null));
    body.innerHTML = `<div class="quiz">
      ${numNav(Q.qs.map((x) => x.pick != null), Q.i, 'qjump', 'Questions')}
      <div class="problem-card"><div class="meta"><span class="eyebrow">Question ${Q.i + 1} of ${n} · graded when you turn it in</span><button class="tbtn" data-act="readQ">${I.speaker} Read</button></div><div class="integral">${T(q.p.tex, true)}</div></div>
      <div class="opts">${q.opts.map((o, k) => `<button class="opt${q.pick === k ? ' picked' : ''}" data-act="qpick" data-k="${k}" aria-pressed="${q.pick === k}"><span class="key">${'ABCD'[k]}</span><span>${T(o.tex)}</span></button>`).join('')}</div>
      ${Q.confirm && blanks ? `<div class="feedback info"><span class="mark">!</span><span>You left ${blanks} question${blanks > 1 ? 's' : ''} blank, and blank counts as wrong.<span class="row" style="margin-top:8px"><button class="btn sm accent" data-act="qfinish" data-sure="1">Turn it in anyway</button><button class="btn sm soft" data-act="qjump" data-k="${firstBlank}">Go to question ${firstBlank + 1}</button></span></span></div>` : ''}
      <div class="row between"><button class="btn ghost" data-act="qnav" data-d="-1" ${Q.i === 0 ? 'disabled' : ''}>${I.back} Back</button>${Q.i < n - 1 ? `<button class="btn accent" data-act="qnav" data-d="1">Next ${I.next}</button>` : `<button class="btn accent" data-act="qfinish">Turn it in ${I.check}</button>`}</div>
    </div>`;
    return;
  }
  // results
  const right = Q.qs.filter((q) => q.opts[q.pick] && q.opts[q.pick].correct).length;
  const pass = right >= 7;
  body.innerHTML = `<div class="quiz">
    <div class="card pad" style="display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:center">
      <div class="grade-big">${UI.letter(right / 8)}</div>
      <div><h2 style="font-family:var(--font-display);font-size:28px">${right}/8 — ${pass ? 'Boss defeated!' : 'Not yet. Patch the misses and run it back.'}</h2>
        <p class="muted">${pass ? (ORDER.indexOf(u.key) < ORDER.length - 1 ? `${M.unit(ORDER[ORDER.indexOf(u.key) + 1]).name} is unlocked.` : 'All five sections mastered. The Test Simulator is unlocked.') : 'You need 7 of 8. Every miss below shows the exact trap.'}</p>
        <div class="row" style="margin-top:12px">${pass && ORDER.indexOf(u.key) < ORDER.length - 1 ? `<button class="btn accent" data-act="openUnit" data-u="${ORDER[ORDER.indexOf(u.key) + 1]}">Next section ${I.next}</button>` : pass ? `<button class="btn accent" data-act="test">Test Simulator ${I.next}</button>` : `<button class="btn accent" data-act="startQuiz">${I.reset} Retry with new questions</button>`}<button class="btn soft" data-act="tab" data-tab="practice">Back to practice</button></div></div></div>
    <div class="review">${Q.qs.map((q, k) => reviewHTML(q, k)).join('')}</div></div>`;
}
function reviewHTML(q, k) {
  const o = q.opts[q.pick]; const ok = o && o.correct; const right = q.opts.find((x) => x.correct);
  return `<div class="rev ${ok ? '' : 'no'}"><div class="row between"><b>${ok ? '✓' : '✗'} Question ${k + 1}</b><button class="btn sm ghost" data-act="revSol" data-k="${k}">${q.showSol ? 'Hide' : 'Show'} steps</button></div>
    <div class="tex">${T(q.p.tex, true)}</div>
    ${ok ? `<div class="muted">Your answer: ${T(right.tex)}</div>` : `<div>You picked ${T(o ? o.tex : '\\text{nothing}')}</div><div>Answer: ${T(right.tex)}</div>${o && o.msg ? `<div class="muted" style="margin-top:4px">${R(o.msg)}</div>` : ''}`}
    ${q.showSol ? `<div class="solution" style="margin-top:8px">${q.p.steps.map((s, i) => `<div class="sol-step"><h4><span class="n">${i + 1}</span>${R(s.title)}</h4><div class="math-lines">${s.lines.map((l) => T(l, true)).join('')}</div></div>`).join('')}</div>` : ''}</div>`;
}
ACT.startQuiz = () => {
  const u = app.route.unit;
  const levels = M.rng().shuffle([1, 1, 2, 2, 2, 3, 3, 3]);
  app.Q = { unit: u, stage: 'q', i: 0, qs: buildQuiz([u], levels) };
  renderUnit();
};
ACT.qpick = (el) => {
  const Q = app.Q; if (!Q || Q.stage !== 'q') return;
  Q.qs[Q.i].pick = +el.dataset.k; Q.confirm = false;
  UI.Sound.play('tick');
  renderUnit();
};
ACT.qnav = (el) => { const Q = app.Q; if (!Q || Q.stage !== 'q') return; Q.i = Math.max(0, Math.min(Q.qs.length - 1, Q.i + +el.dataset.d)); Q.confirm = false; renderUnit(); scrollToProblem(); };
ACT.qjump = (el) => { const Q = app.Q; if (!Q || Q.stage !== 'q') return; Q.i = Math.max(0, Math.min(Q.qs.length - 1, +el.dataset.k)); Q.confirm = false; renderUnit(); scrollToProblem(); };
ACT.qfinish = (el) => {
  const Q = app.Q; if (!Q || Q.stage !== 'q') return;
  const blanks = Q.qs.filter((x) => x.pick == null).length;
  if (blanks && !(el && el.dataset && el.dataset.sure)) { Q.confirm = true; renderUnit(); return; }
  Q.stage = 'done';
  const right = Q.qs.filter((q) => q.opts[q.pick] && q.opts[q.pick].correct).length;
  const us = st().units[Q.unit];
  us.quizBest = Math.max(us.quizBest || 0, right);
  st().xp += right * 10;
  Q.qs.forEach((q) => { const o = q.opts[q.pick]; if (o && !o.correct && o.tag) st().traps[o.tag] = (st().traps[o.tag] || 0) + 1; });
  markDay();
  if (right < 7) UI.Sound.play('chime');
  if (right >= 7 && !us.quizPassed) {
    us.quizPassed = true; us.mastery = Math.max(us.mastery, 100); st().xp += 100;
    Store.save(); renderUnit(); UI.Sound.play('level'); UI.confetti(200);
    const nxt = ORDER[ORDER.indexOf(Q.unit) + 1];
    setTimeout(() => celebrate(`${M.unit(Q.unit).short} mastered!`, nxt ? `${right}/8 on the boss quiz. ${M.unit(nxt).name} (${M.unit(nxt).sec}) is now unlocked. +100 XP` : `${right}/8. All five sections are mastered. The Test Simulator is unlocked. +100 XP`, nxt ? 'next' : 'test', nxt), 500);
  } else { Store.save(); renderUnit(); if (right >= 7) UI.confetti(120); }
  G.scrollTo({ top: 0 });
};
ACT.readQ = () => { const q = app.Q.qs[app.Q.i]; UI.Voice.say(q.p.speech); };
ACT.revSol = (el) => { const Q = app.route.name === 'test' ? app.TS : app.Q; const q = Q.qs[+el.dataset.k]; q.showSol = !q.showSol; render(); };

/* ================= WHICH METHOD? ================= */
function renderMethod() {
  const MG = app.MG;
  const best = st().method.best;
  if (!MG || MG.stage === 'intro') {
    view.innerHTML = `<div class="mgame u-trig"><button class="backlink" data-act="home">${I.back} Map</button>
      <div class="card pad stack" style="text-align:center;align-items:center">
        <div class="eyebrow">60-second speed round</div><h1 style="font-family:var(--font-display);font-size:40px">Which Method?</h1>
        <p class="muted" style="max-width:54ch">An integral flashes up. Tap the technique you would use. Watch out: some are u-sub traps dressed up as harder methods. Streaks build your combo.</p>
        <div class="row" style="justify-content:center">${M.METHODS.map((m) => `<span class="chip">${m.name}</span>`).join('')}</div>
        <div class="muted">Best: <b class="tnum">${best}</b></div>
        <button class="btn accent" data-act="mStart">Start ${I.play}</button></div></div>`;
    return;
  }
  if (MG.stage === 'play') {
    const q = MG.q;
    view.innerHTML = `<div class="mgame u-trig"><div class="row between"><span class="score-big">${MG.score}</span>${MG.combo >= 2 ? `<span class="combo">combo ×${MG.combo}</span>` : '<span></span>'}<span class="chip tnum" id="mTime">${Math.ceil(MG.left)}s</span></div>
      <div class="timer-bar"><i id="mBar" style="width:${(MG.left / 60) * 100}%"></i></div>
      <div class="problem-card"><div class="integral">${T(q.tex, true)}</div></div>
      <div class="mbtns">${M.METHODS.map((m) => `<button data-act="mPick" data-m="${m.key}" class="${MG.picked ? (q.ok.includes(m.key) ? 'right' : MG.picked === m.key ? 'wrong' : '') : ''}" ${MG.picked ? 'disabled' : ''}>${m.name}</button>`).join('')}</div>
      <div id="mfb" style="min-height:48px">${MG.picked ? `<div class="feedback ${q.ok.includes(MG.picked) ? 'good' : 'bad'}"><span class="mark">${q.ok.includes(MG.picked) ? '✓' : '✗'}</span><span>${R(q.why)}</span></div>` : ''}</div></div>`;
    return;
  }
  const isBest = MG.score >= best && MG.score > 0;
  view.innerHTML = `<div class="mgame u-trig"><button class="backlink" data-act="home">${I.back} Map</button>
    <div class="card pad stack" style="text-align:center;align-items:center"><div class="eyebrow">Time!</div><div class="score-big">${MG.score}</div><div class="muted">${MG.right} right · ${MG.wrong} wrong · best combo ×${MG.bestCombo}</div>${isBest ? '<div class="combo">New best!</div>' : ''}
      <div class="row" style="justify-content:center"><button class="btn accent" data-act="mStart">${I.reset} Play again</button><button class="btn soft" data-act="home">Back to map</button></div></div>
    ${MG.misses.length ? `<div class="review"><div class="eyebrow">Review your misses</div>${MG.misses.map((q) => `<div class="rev no"><div class="tex">${T(q.tex, true)}</div><div><b>Best method:</b> ${q.ok.map((k) => M.METHODS.find((m) => m.key === k).name).join(' or ')}</div><div class="muted">${R(q.why)}</div></div>`).join('')}</div>` : ''}</div>`;
}
ACT.mStart = () => {
  const r = M.rng();
  app.MG = { stage: 'play', score: 0, combo: 0, bestCombo: 0, right: 0, wrong: 0, left: 60, q: M.methodQuestion(r), r, picked: null, misses: [] };
  const MG = app.MG; let last = performance.now();
  MG.timer = setInterval(() => {
    const now = performance.now(); MG.left -= (now - last) / 1000; last = now;
    const t = document.getElementById('mTime'), b = document.getElementById('mBar');
    if (t) t.textContent = Math.max(0, Math.ceil(MG.left)) + 's'; if (b) b.style.width = Math.max(0, (MG.left / 60) * 100) + '%';
    if (MG.left <= 0) {
      clearInterval(MG.timer); MG.timer = null; MG.stage = 'end';
      const s = st(); s.method.played++; if (MG.score > s.method.best) s.method.best = MG.score; s.xp += MG.right * 3; markDay(); Store.save();
      UI.Sound.play('level'); if (MG.score >= s.method.best && MG.score > 0) UI.confetti(120);
      renderMethod(); header();
    }
  }, 100);
  renderMethod();
};
ACT.mPick = (el) => {
  const MG = app.MG; if (!MG || MG.stage !== 'play' || MG.picked) return;
  MG.picked = el.dataset.m; const ok = MG.q.ok.includes(MG.picked);
  if (ok) { MG.combo++; MG.right++; MG.score += 10 + Math.min(MG.combo - 1, 5) * 2; MG.bestCombo = Math.max(MG.bestCombo, MG.combo); UI.Sound.play('good'); }
  else { MG.combo = 0; MG.wrong++; MG.misses.push(MG.q); UI.Sound.play('bad'); }
  renderMethod();
  setTimeout(() => { if (app.MG === MG && MG.stage === 'play') { MG.q = M.methodQuestion(MG.r); MG.picked = null; renderMethod(); } }, ok ? 650 : 2200);
};

/* ================= TEST SIMULATOR ================= */
function renderTest() {
  const TS = app.TS;
  if (!TS || TS.stage === 'intro') {
    view.innerHTML = `<div class="quiz"><button class="backlink" data-act="home">${I.back} Map</button>
      <div class="card pad stack" style="text-align:center;align-items:center"><div class="eyebrow">Final boss</div><h1 style="font-family:var(--font-display);font-size:40px">Test Simulator</h1>
      <p class="muted" style="max-width:56ch">12 questions mixed from all five sections (7.1 to 7.4 and 7.8), in random order, like the real test. No feedback until the end. You get a letter grade, a breakdown by section, and the full steps for every miss.</p>
      <label class="switch" style="width:min(100%,360px)"><span>30-minute timer <small class="muted">(you can pause it)</small></span><input type="checkbox" id="tsTimer" checked></label>
      ${st().test.best != null ? `<div class="muted">Best: <b>${Math.round(st().test.best * 100)}%</b></div>` : ''}
      <button class="btn accent" data-act="tsStart">Start the test ${I.play}</button></div></div>`;
    return;
  }
  if (TS.stage === 'q') {
    const q = TS.qs[TS.i];
    const clock = TS.timed ? `<button class="chip tnum ts-clock${TS.paused ? ' paused' : ''}" data-act="tsPause" aria-label="${TS.paused ? 'Resume the test clock' : 'Pause the test clock'}" title="${TS.paused ? 'Resume' : 'Pause'} (P)">${TS.paused ? I.play : I.pause}<span id="tsTime"></span></button>` : '';
    if (TS.paused) {
      const done = TS.qs.filter((x) => x.pick != null).length;
      view.innerHTML = `<div class="quiz u-${q.unit}">
        <div class="row between"><span class="eyebrow">Question ${TS.i + 1} of ${TS.qs.length}</span>${clock}</div>
        <div class="card pad paused-card" role="status">
          <div class="pz-mark">${I.pause}</div>
          <h2>Paused</h2>
          <p class="muted">The clock stopped at <b class="tnum">${fmtClock(TS.left)}</b>. ${done} of ${TS.qs.length} answered, all saved.</p>
          <p class="muted">The questions stay hidden until you come back, so your time stays real.</p>
          <button class="btn accent xl" data-act="tsPause">${I.play} Resume the test</button>
        </div></div>`;
      tickTS();
      return;
    }
    view.innerHTML = `<div class="quiz u-${q.unit}">
      <div class="row between"><span class="eyebrow">Question ${TS.i + 1} of ${TS.qs.length} · ${M.unit(q.unit).sec}</span>${clock}</div>
      ${numNav(TS.qs.map((x) => x.pick != null), TS.i, 'tsJump', 'Questions')}
      <div class="problem-card"><div class="integral">${T(q.p.tex, true)}</div></div>
      <div class="opts">${q.opts.map((o, k) => `<button class="opt${q.pick === k ? ' picked' : ''}" data-act="tsPick" data-k="${k}" aria-pressed="${q.pick === k}"><span class="key">${'ABCD'[k]}</span><span>${T(o.tex)}</span></button>`).join('')}</div>
      <div class="row between"><button class="btn ghost" data-act="tsNav" data-d="-1" ${TS.i === 0 ? 'disabled' : ''}>${I.back} Back</button>${TS.i < TS.qs.length - 1 ? `<button class="btn accent" data-act="tsNav" data-d="1">Next ${I.next}</button>` : `<button class="btn accent" data-act="tsFinish">Turn it in ${I.check}</button>`}</div></div>`;
    tickTS();
    return;
  }
  const right = TS.qs.filter((q) => q.opts[q.pick] && q.opts[q.pick].correct).length;
  const by = ORDER.map((k) => { const qs = TS.qs.filter((q) => q.unit === k); return { k, n: qs.length, r: qs.filter((q) => q.opts[q.pick] && q.opts[q.pick].correct).length }; });
  view.innerHTML = `<div class="quiz"><button class="backlink" data-act="home">${I.back} Map</button>
    <div class="card pad" style="display:grid;grid-template-columns:auto 1fr;gap:20px;align-items:center"><div class="grade-big">${UI.letter(right / TS.qs.length)}</div>
      <div><h2 style="font-family:var(--font-display);font-size:28px">${right}/${TS.qs.length} (${Math.round((100 * right) / TS.qs.length)}%)</h2>
      <div class="stat-row">${by.map((b) => `<div class="stat u-${b.k}"><b style="color:var(--u)">${b.r}/${b.n}</b><span>${M.unit(b.k).sec}</span></div>`).join('')}</div>
      <div class="row" style="margin-top:12px"><button class="btn accent" data-act="tsStart">${I.reset} New test</button><button class="btn soft" data-act="traps">Drill my traps</button></div></div></div>
    <div class="review">${TS.qs.map((q, k) => reviewHTML(q, k)).join('')}</div></div>`;
}
const fmtClock = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, '0')}`;
function tickTS() {
  const TS = app.TS; if (!TS || !TS.timed || TS.stage !== 'q') return;
  const el = document.getElementById('tsTime'); if (!el) return;
  const left = TS.paused ? TS.left : Math.max(0, TS.end - Date.now());
  el.textContent = fmtClock(left);
  if (TS.paused) return; // stopped: nothing to count down
  if (left <= 0) { ACT.tsFinish(); return; }
  clearTimeout(TS.tick); TS.tick = setTimeout(tickTS, 500);
}
ACT.tsStart = () => {
  const timed = document.getElementById('tsTimer') ? document.getElementById('tsTimer').checked : true;
  const units = M.rng().shuffle(ORDER.concat(ORDER).concat(['pf', 'imp']));
  const levels = M.rng().shuffle([1, 1, 2, 2, 2, 2, 2, 2, 3, 3, 3, 3]);
  const qs = [];
  units.forEach((u, i) => { const one = buildQuiz([u], [levels[i]]); if (one[0]) qs.push(one[0]); });
  if (app.TS) clearTimeout(app.TS.tick);
  app.TS = { stage: 'q', i: 0, qs, timed, end: Date.now() + 30 * 60000, paused: false, left: 0, heldSprint: false };
  renderTest();
};
/** stop or restart the test clock; a running focus sprint pauses and resumes along with it */
ACT.tsPause = () => {
  const TS = app.TS; if (!TS || TS.stage !== 'q' || !TS.timed) return;
  UI.Sound.play('tick');
  if (TS.paused) {
    TS.end = Date.now() + TS.left; TS.paused = false;
    if (TS.heldSprint && UI.Sprint && UI.Sprint.paused()) UI.Sprint.start();
    TS.heldSprint = false;
  } else {
    TS.left = Math.max(0, TS.end - Date.now()); TS.paused = true; clearTimeout(TS.tick);
    if (UI.Sprint && UI.Sprint.state.running) { UI.Sprint.pause(); TS.heldSprint = true; }
  }
  renderTest(); G.scrollTo({ top: 0 });
};
ACT.tsPick = (el) => { if (!app.TS || app.TS.stage !== 'q' || app.TS.paused) return; app.TS.qs[app.TS.i].pick = +el.dataset.k; UI.Sound.play('tick'); renderTest(); };
ACT.tsNav = (el) => { if (!app.TS || app.TS.stage !== 'q' || app.TS.paused) return; app.TS.i = Math.max(0, Math.min(app.TS.qs.length - 1, app.TS.i + +el.dataset.d)); renderTest(); G.scrollTo({ top: 0 }); };
ACT.tsJump = (el) => { if (!app.TS || app.TS.stage !== 'q' || app.TS.paused) return; app.TS.i = Math.max(0, Math.min(app.TS.qs.length - 1, +el.dataset.k)); renderTest(); };
ACT.tsFinish = () => {
  const TS = app.TS; if (!TS || TS.stage !== 'q' || TS.paused) return;
  clearTimeout(TS.tick); TS.stage = 'done';
  const right = TS.qs.filter((q) => q.opts[q.pick] && q.opts[q.pick].correct).length; const f = right / TS.qs.length;
  const s = st(); s.test.played++; s.test.best = Math.max(s.test.best || 0, f); s.xp += right * 15;
  TS.qs.forEach((q) => { const o = q.opts[q.pick]; if (o && !o.correct && o.tag) s.traps[o.tag] = (s.traps[o.tag] || 0) + 1; });
  markDay(); Store.save(); header();
  if (f >= 0.9) { UI.Sound.play('level'); UI.confetti(220); }
  renderTest(); G.scrollTo({ top: 0 });
};

/* ================= TRAPS ================= */
function renderTraps() {
  const traps = Object.entries(st().traps).sort((a, b) => b[1] - a[1]);
  view.innerHTML = `<div class="traps"><button class="backlink" data-act="home">${I.back} Map</button>
    <div><div class="eyebrow">Your mistake log</div><h1 style="font-family:var(--font-display);font-size:36px">Trap tracker</h1><p class="muted">Every slip gets logged by type. Drill your top trap until it stops showing up.</p></div>
    ${traps.length ? traps.map(([k, n]) => { const t = M.TRAPS[k] || { name: k, patch: '' }; return `<div class="card trap"><span class="count">×${n}</span><div><h3>${UI.esc(t.name)}</h3><p>${R(t.patch)}</p></div>${t.drill && !isLocked(t.drill[0]) ? `<button class="btn sm soft u-${t.drill[0]}" data-act="drill" data-u="${t.drill[0]}" data-f="${t.drill[1]}">Drill it ${I.next}</button>` : '<span></span>'}</div>`; }).join('') : '<div class="card empty-state">No traps yet. Go make some mistakes (seriously, that is how this works).</div>'}
    ${traps.length ? '<div class="row end"><button class="btn ghost sm" data-act="clearTraps">Clear the log</button></div>' : ''}</div>`;
}
ACT.drill = (el) => { const u = el.dataset.u; newProblem(u, { family: el.dataset.f, drill: true, mode: 'steps', forced: true }); app.route = { name: 'unit', unit: u, tab: 'practice' }; render(); G.scrollTo({ top: 0 }); };
ACT.clearTraps = (el) => { if (el.dataset.sure) { st().traps = {}; Store.save(); renderTraps(); return; } el.dataset.sure = '1'; el.textContent = 'Tap again to clear'; setTimeout(() => { if (el.isConnected) { delete el.dataset.sure; el.textContent = 'Clear the log'; } }, 3000); };

/* ================= MODALS ================= */
function openModal(html) {
  closeModal();
  const s = document.createElement('div'); s.className = 'modal-scrim'; s.onclick = closeModal;
  const m = document.createElement('div'); m.className = 'modal card'; m.setAttribute('role', 'dialog'); m.setAttribute('aria-modal', 'true'); m.innerHTML = html;
  document.body.append(s, m);
  const f = m.querySelector('button, input, select'); f && f.focus();
  return m;
}
function closeModal() { document.querySelectorAll('.modal, .modal-scrim').forEach((n) => n.remove()); }
UI.closeModal = closeModal;
ACT.closeModal = closeModal;
function celebrate(title, text, next, nextUnit) {
  const m = openModal(`<div class="celebrate"><div class="badge">${T('\\int')}</div><h2>${UI.esc(title)}</h2><p class="muted" style="margin-top:8px">${UI.esc(text)}</p>
    <div class="row" style="justify-content:center;margin-top:16px">${next === 'quiz' ? '<button class="btn accent" data-act="goQuiz">Take the boss quiz</button>' : next === 'next' ? `<button class="btn accent" data-act="openUnit" data-u="${nextUnit}">Go to ${UI.esc(M.unit(nextUnit).short)}</button>` : next === 'test' ? '<button class="btn accent" data-act="test">Test Simulator</button>' : ''}<button class="btn soft" data-act="closeModal">Keep going</button></div></div>`);
  m.addEventListener('click', (e) => { if (e.target.closest('[data-act]')) setTimeout(closeModal, 0); });
}
ACT.goQuiz = () => { closeModal(); app.route.tab = 'quiz'; app.Q = null; render(); };
ACT.rank = () => {
  const s = st(); const r = UI.rank(s.xp);
  openModal(`<div class="pad stack"><div class="row between"><h2 style="font-family:var(--font-display);font-size:26px">${UI.esc(r.name)}</h2><button class="icon-btn" data-act="closeModal" aria-label="Close">${I.x}</button></div>
    <div class="mastery-line"><span class="tnum">${s.xp} XP</span><div class="xpbar"><i style="width:${rankPct()}%"></i></div><span class="tnum">${r.next ? r.next[0] : 'max'}</span></div>
    ${r.next ? `<p class="muted">${r.next[0] - s.xp} XP to <b>${UI.esc(r.next[1])}</b>.</p>` : '<p class="muted">Top rank. Legend status.</p>'}
    <div class="stat-row">${ORDER.map((k) => `<div class="stat u-${k}"><b style="color:var(--u)">${s.units[k].quizPassed ? '✓' : s.units[k].mastery + '%'}</b><span>${M.unit(k).sec}</span></div>`).join('')}</div>
    <div class="stat-row"><div class="stat"><b>${s.bestCombo}</b><span>best combo</span></div><div class="stat"><b>${s.method.best}</b><span>method best</span></div><div class="stat"><b>${s.test.best != null ? Math.round(s.test.best * 100) + '%' : '—'}</b><span>test best</span></div></div>
    <p class="muted" style="font-size:13px">${Store.synced ? 'Progress is saved to your account, so it follows you across devices.' : 'Progress is saved in this browser.'}</p></div>`);
};
ACT.settings = () => {
  const s = st().settings;
  const voices = UI.Voice.voices;
  const m = openModal(`<div class="pad stack"><div class="row between"><h2 style="font-family:var(--font-display);font-size:26px">Settings</h2><button class="icon-btn" data-act="closeModal" aria-label="Close">${I.x}</button></div>
    <div>
      <label class="switch"><span>Sound effects</span><input type="checkbox" id="setSound" ${s.sound ? 'checked' : ''}></label>
      <label class="switch"><span>Read new problems aloud<br><span class="sub">The voice says each integral when it appears</span></span><input type="checkbox" id="setAuto" ${s.autoRead ? 'checked' : ''}></label>
      <div class="switch"><span>Voice</span><select id="setVoice" style="max-width:200px">${voices.length ? voices.map((v) => `<option ${v.name === s.voice ? 'selected' : ''}>${UI.esc(v.name)}</option>`).join('') : '<option>Default</option>'}</select></div>
      <div class="switch"><span>Voice speed</span><input type="range" id="setRate" min="0.7" max="1.4" step="0.05" value="${s.rate}" style="width:140px"></div>
      <div class="switch"><span>Theme</span><select id="setTheme"><option value="system" ${s.theme === 'system' ? 'selected' : ''}>Match my device</option><option value="light" ${s.theme === 'light' ? 'selected' : ''}>Light</option><option value="dark" ${s.theme === 'dark' ? 'selected' : ''}>Dark</option></select></div>
      <label class="switch"><span>Focus mode in quiz sets<br><span class="sub">Hide everything except the problem, your answer and your progress</span></span><input type="checkbox" id="setFocus" ${s.focus ? 'checked' : ''}></label>
      <div class="switch"><span>Daily goal<br><span class="sub">Problems per day that fill the ring on the home page</span></span><select id="setGoal">${[5, 10, 15, 20].map((g) => `<option value="${g}" ${g === (s.goal || 10) ? 'selected' : ''}>${g} problems</option>`).join('')}</select></div>
      <label class="switch"><span>Unlock everything<br><span class="sub">Skip the mastery locks (handy the night before a test)</span></span><input type="checkbox" id="setUnlock" ${s.unlockAll ? 'checked' : ''}></label>
    </div>
    <div class="row between"><button class="btn sm ghost" data-act="testVoice">${I.speaker} Test voice</button><button class="btn sm soft" id="resetBtn" style="color:var(--bad)">Reset all progress</button></div></div>`);
  const save = () => { Store.save(); };
  m.querySelector('#setSound').onchange = (e) => { s.sound = e.target.checked; save(); };
  m.querySelector('#setAuto').onchange = (e) => { s.autoRead = e.target.checked; save(); };
  m.querySelector('#setVoice').onchange = (e) => { s.voice = e.target.value; save(); };
  m.querySelector('#setRate').onchange = (e) => { s.rate = +e.target.value; save(); };
  m.querySelector('#setTheme').onchange = (e) => { s.theme = e.target.value; save(); if (s.theme === 'system') { if (UI.hostTheme) document.documentElement.setAttribute('data-theme', UI.hostTheme); else document.documentElement.removeAttribute('data-theme'); } else UI.applyTheme(); };
  m.querySelector('#setUnlock').onchange = (e) => { s.unlockAll = e.target.checked; save(); render(); };
  m.querySelector('#setFocus').onchange = (e) => { s.focus = e.target.checked; app.focusOff = false; save(); render(); };
  m.querySelector('#setGoal').onchange = (e) => { s.goal = +e.target.value || 10; save(); render(); };
  const rb = m.querySelector('#resetBtn');
  rb.onclick = () => { if (rb.dataset.sure) { Store.reset(); closeModal(); app.P = null; app.Q = null; go({ name: 'home' }); UI.toast('Progress reset.'); return; } rb.dataset.sure = '1'; rb.textContent = 'Tap again to erase everything'; setTimeout(() => { if (rb.isConnected) { delete rb.dataset.sure; rb.textContent = 'Reset all progress'; } }, 3500); };
};
ACT.testVoice = () => UI.Voice.say(M.speak('\\int x\\,e^{2x}\\,dx = \\frac{1}{2}x e^{2x} - \\frac{1}{4}e^{2x} + C'));

/* context for Ask Claude */
UI.problemContext = function () {
  if (app.route.name !== 'unit' || app.route.tab !== 'practice') return null;
  const k = app.route.unit;
  const pack = (p, extra) => ({
    unit: M.unit(k).name, tex: p.tex, answer: p.improper ? (p.improper.converges ? `converges to ${p.improper.exact}` : 'diverges') : answerTex(p),
    steps: p.steps.map((s, i) => `Step ${i + 1} — ${s.title}: ${s.lines.join('  |  ')}`).join('\n'),
    outOf: p.outOf, p, ...extra,
  });
  if (practiceMode(k) === 'set') {
    const S = app.SET[k]; if (!S) return null;
    if (S.stage === 'work') {
      const it = S.items[S.i];
      return pack(it.p, { current: null, stepTitle: '', attempt: it.ans, quiz: true, peeked: it.hints, key: `set:${k}:${it.seed}`, label: `problem ${S.i + 1} of ${S.items.length}` });
    }
    const f = app.askFocus;
    if (S.stage === 'report' && f && f.unit === k && S.results && S.results[f.k]) {
      const r = S.results[f.k], g = r.g;
      return pack(r.it.p, {
        current: null, stepTitle: '', attempt: r.it.ans, graded: true, score: g.score, gOutOf: g.outOf,
        diagnosis: g.diagnosis ? g.diagnosis.msg || '' : '', notes: (g.notes || []).map((n) => n.text).join(' '),
        key: `res:${k}:${r.it.seed}`, label: `problem ${f.k + 1} · graded ${g.score}/${g.outOf}`,
      });
    }
    return null;
  }
  const P = app.P; if (!P || P.unit !== k) return null;
  return pack(P.p, {
    current: P.done ? null : P.cur, stepTitle: P.p.steps[P.cur] ? P.p.steps[P.cur].title : '',
    attempt: P.mode === 'test' ? P.testInput : (P.steps[P.cur] && P.steps[P.cur].input) || '',
    peeked: P.mode === 'test' ? P.hints : 0, key: `p:${P.p.id}`,
  });
};
UI.practiceMode = practiceMode;
/** the problem on screen right now (single practice problem or the open quiz-set problem), for the Step list */
UI.currentProblem = function () {
  const r = app.route; if (r.name !== 'unit' || r.tab !== 'practice') return null;
  const k = r.unit;
  if (practiceMode(k) === 'set') { const S = app.SET[k]; const it = S && S.stage === 'work' ? S.items[S.i] : null; return it ? { unit: k, p: it.p, where: `Problem ${S.i + 1} of ${S.items.length}` } : null; }
  return app.P && app.P.unit === k ? { unit: k, p: app.P.p, where: app.P.guide ? 'Study guide problem' : 'This problem' } : null;
};
})(typeof globalThis !== 'undefined' ? globalThis : this);
