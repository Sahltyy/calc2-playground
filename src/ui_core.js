/* ==========================================================================
   UI CORE — store, rendering helpers, voice, sound, confetti, toasts, icons
   ========================================================================== */
(function (G) {
'use strict';
const M = G.M;
const UI = (G.UI = G.UI || {});

/* ---------------- icons ---------------- */
const ic = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" ${extra}>${d}</svg>`;
UI.I = {
  calc: ic('<rect x="5" y="2.5" width="14" height="19" rx="3"/><rect x="8" y="5.5" width="8" height="4" rx="1"/><path d="M8.5 13h.01M12 13h.01M15.5 13h.01M8.5 16.5h.01M12 16.5h.01M15.5 16.5h.01"/>'),
  sigma: ic('<path d="M17.5 5H6.5l6 7-6 7h11"/>'),
  pencil: ic('<path d="M4 20l4.2-1 10.4-10.4a2.1 2.1 0 0 0-3-3L5.2 16 4 20z"/><path d="M14 7l3 3"/>'),
  graph: ic('<path d="M4 4v16h16"/><path d="M7 16c2.5-1 3.5-8 6-8s3.5 4 6 3"/>'),
  circle: ic('<circle cx="12" cy="12" r="8.5"/><path d="M12 3.5v17M3.5 12h17"/><path d="M12 12l5.3-5.3" stroke-width="2.3"/>'),
  timer: ic('<circle cx="12" cy="13.5" r="7.5"/><path d="M12 9.5v4l2.5 2M9.5 2.5h5"/>'),
  ask: ic('<path d="M20 12.5a7.5 7.5 0 0 1-11 6.6L4 20.5l1.4-4.4A7.5 7.5 0 1 1 20 12.5z"/><path d="M12 9.2v.01M12 12v3"/>'),
  speaker: ic('<path d="M4 9.5v5h3.5L12 18.5v-13L7.5 9.5H4z"/><path d="M15.5 9a4.5 4.5 0 0 1 0 6M18 6.5a8 8 0 0 1 0 11"/>'),
  stop: ic('<rect x="6.5" y="6.5" width="11" height="11" rx="2.2"/>'),
  bulb: ic('<path d="M9 17.5h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.4 1.1 2.2v.5h5V16c0-.8.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/>'),
  dice: ic('<path d="M4 7h11l-3-3M20 17H9l3 3"/>'),
  gear: ic('<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 0 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 0 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 0 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 0 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z"/>'),
  back: ic('<path d="M15 5l-7 7 7 7"/>'),
  next: ic('<path d="M9 5l7 7-7 7"/>'),
  lock: ic('<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8.5 10.5V7.5a3.5 3.5 0 0 1 7 0v3"/>'),
  check: ic('<path d="M5 12.5l4.5 4.5L19 7.5"/>'),
  x: ic('<path d="M6 6l12 12M18 6L6 18"/>'),
  kb: ic('<rect x="2.5" y="6" width="19" height="12" rx="2.5"/><path d="M6.5 10h.01M10 10h.01M13.5 10h.01M17 10h.01M7.5 14h9"/>'),
  trophy: ic('<path d="M8 4h8v5a4 4 0 0 1-8 0V4z"/><path d="M8 6H5a2.5 2.5 0 0 0 3 4M16 6h3a2.5 2.5 0 0 1-3 4M12 13v4M8.5 20.5h7M10 17h4v3.5h-4z"/>'),
  flame: ic('<path d="M12 21c4 0 6.5-2.6 6.5-6.2 0-3.6-3-5.6-3.6-9.3-2.3 1.4-3.3 3.7-3.4 5.6-1-.8-1.6-2-1.7-3.3C7.5 9.6 5.5 12 5.5 14.8 5.5 18.4 8 21 12 21z"/>'),
  bolt: ic('<path d="M13 2.5L5.5 13.5H12l-1 8 7.5-11H12l1-8z"/>'),
  play: ic('<path d="M7 5l11 7-11 7V5z"/>'),
  pause: ic('<path d="M8 5v14M16 5v14"/>'),
  reset: ic('<path d="M4 12a8 8 0 1 0 2.4-5.7L4 8.5"/><path d="M4 4v4.5h4.5"/>'),
  undo: ic('<path d="M9 14L4 9l5-5"/><path d="M4 9h10a6 6 0 0 1 0 12h-3"/>'),
  eraser: ic('<path d="M7 20h11M5.5 15.5l9-9a2 2 0 0 1 2.8 0l2.2 2.2a2 2 0 0 1 0 2.8L12 19H8.5l-3-3a.8.8 0 0 1 0-.5z"/>'),
  trash: ic('<path d="M4 7h16M10 11v6M14 11v6M5.5 7l1 13h11l1-13M9 7V4h6v3"/>'),
  camera: ic('<path d="M4 8h3l1.6-2.5h6.8L17 8h3v11H4V8z"/><circle cx="12" cy="13" r="3.5"/>'),
  send: ic('<path d="M4 12l16-8-6 16-2.5-6.5L4 12z"/>'),
  book: ic('<path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15z"/><path d="M4 20.5A2.5 2.5 0 0 1 6.5 18H20v3H6.5"/>'),
  target: ic('<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1"/>'),
  sparkle: ic('<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8L12 3z"/><path d="M19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8L19 16z"/>'),
  plus: ic('<path d="M12 5v14M5 12h14"/>'),
  minus: ic('<path d="M5 12h14"/>'),
  home: ic('<path d="M4 11l8-7 8 7v9h-5v-6H9v6H4v-9z"/>'),
  headphones: ic('<path d="M4 15v-3a8 8 0 0 1 16 0v3"/><rect x="3" y="14" width="4.5" height="6.5" rx="1.6"/><rect x="16.5" y="14" width="4.5" height="6.5" rx="1.6"/>'),
  eye: ic('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'),
  list: ic('<path d="M9.5 6.5h10M9.5 12h10M9.5 17.5h10"/><path d="M4 6.5l1.2 1.2L7.4 5.3M4 12l1.2 1.2 2.2-2.4M4 17.5l1.2 1.2 2.2-2.4"/>'),
  sign: ic('<path d="M12 3v18M8.5 21h7"/><path d="M5 5.5h11l3 3-3 3H5z"/>'),
};

/* ---------------- escaping, math, rich text ---------------- */
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
UI.esc = esc;
UI.tex = function (s, display = false, trust = true) {
  if (!G.katex) return `<span class="mono">${esc(s)}</span>`;
  try {
    return G.katex.renderToString(String(s), { displayMode: display, throwOnError: false, strict: false, trust: trust ? (c) => c.command === '\\htmlClass' : false, output: 'html' });
  } catch (e) { return `<span class="mono">${esc(s)}</span>`; }
};
const T = UI.tex;
/** text with $inline$ / $$display$$ math and **bold** */
UI.rich = function (s, trust = true) {
  if (s == null) return '';
  const parts = String(s).split(/(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g);
  return parts.map((p) => {
    if (p.startsWith('$$') && p.endsWith('$$') && p.length > 4) return T(p.slice(2, -2), true, trust);
    if (p.startsWith('$') && p.endsWith('$') && p.length > 2) return T(p.slice(1, -1), false, trust);
    return esc(p).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
  }).join('');
};
/** markdown-lite for Claude replies */
UI.md = function (src) {
  let s = String(src || '').replace(/\r/g, '');
  s = s.replace(/\\\[([\s\S]+?)\\\]/g, (m, x) => `$$${x}$$`).replace(/\\\(([\s\S]+?)\\\)/g, (m, x) => `$${x}$`);
  const blocks = s.split(/\n{2,}/);
  return blocks.map((b) => {
    const lines = b.split('\n');
    if (lines.every((l) => /^\s*([-*•]|\d+[.)])\s+/.test(l))) {
      const ordered = /^\s*\d/.test(lines[0]);
      return `<${ordered ? 'ol' : 'ul'} style="margin:4px 0;padding-left:20px">${lines.map((l) => `<li>${inline(l.replace(/^\s*([-*•]|\d+[.)])\s+/, ''))}</li>`).join('')}</${ordered ? 'ol' : 'ul'}>`;
    }
    if (/^#{1,4}\s/.test(b)) return `<p><strong>${inline(b.replace(/^#{1,4}\s/, ''))}</strong></p>`;
    return `<p>${lines.map(inline).join('<br>')}</p>`;
  }).join('');
  function inline(t) {
    const parts = t.split(/(\$\$[\s\S]+?\$\$|\$[^$]+?\$|`[^`]+`)/g);
    return parts.map((p) => {
      if (p.startsWith('$$') && p.length > 4) return T(p.slice(2, -2), true, false);
      if (p.startsWith('$') && p.endsWith('$') && p.length > 2) return T(p.slice(1, -1), false, false);
      if (p.startsWith('`') && p.endsWith('`')) return `<code class="mono">${esc(p.slice(1, -1))}</code>`;
      return esc(p).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/(^|[^*])\*([^*\s][^*]*?)\*/g, '$1<em>$2</em>');
    }).join('');
  }
};
/** speech for text containing $math$ */
UI.speakText = function (s) {
  return String(s || '').split(/(\$[^$]+\$)/g).map((p) => (p.startsWith('$') ? M.speak(p.slice(1, -1)) : p.replace(/\*\*/g, ''))).join(' ').replace(/\s+/g, ' ').trim();
};

/* ---------------- store (local + account sync) ---------------- */
const KEY = 'calc2-playground.v1';
const DEF = () => ({
  v: 2, updatedAt: 0, xp: 0, combo: 0, bestCombo: 0,
  units: Object.fromEntries(['ibp', 'trig', 'tsub', 'pf', 'imp'].map((k) => [k, { mastery: 0, solved: 0, attempts: 0, perfect: 0, quizBest: null, quizPassed: false, lessonDone: false, lessonAt: 0, levelPin: 0 }])),
  traps: {}, history: [], days: [], method: { best: 0, played: 0 }, test: { best: null, played: 0 }, sets: {}, guide: {}, goalDay: '',
  settings: { sound: true, autoRead: false, rate: 1, voice: '', keypad: 'auto', theme: 'system', unlockAll: false, mode: 'set', setSize: 5, focus: true, goal: 10 },
});
/* v2: quiz sets (graded at the end) become the default practice mode */
function migrate(s) {
  if (!(s.v >= 2)) { s.settings.mode = 'set'; s.v = 2; }
  if (!s.sets || typeof s.sets !== 'object' || Array.isArray(s.sets)) s.sets = {};
  if (!s.guide || typeof s.guide !== 'object' || Array.isArray(s.guide)) s.guide = {};
  if (s.settings.setSize !== 5 && s.settings.setSize !== 10) s.settings.setSize = 5;
  return s;
}
function merge(base, src) {
  if (!src || typeof src !== 'object') return base;
  for (const k of Object.keys(src)) {
    if (base[k] && typeof base[k] === 'object' && !Array.isArray(base[k]) && src[k] && typeof src[k] === 'object' && !Array.isArray(src[k])) merge(base[k], src[k]);
    else base[k] = src[k];
  }
  return base;
}
const Store = (UI.Store = {
  state: DEF(), remote: null, writing: false, dirty: false, timer: 0, synced: false,
  load() {
    try { const raw = localStorage.getItem(KEY); if (raw) this.state = migrate(merge(DEF(), JSON.parse(raw))); } catch (e) { /* storage blocked */ }
    this.loadedAt = this.state.updatedAt || 0;
  },
  save() {
    this.state.updatedAt = Date.now();
    try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch (e) { /* ignore */ }
    this.queue();
  },
  queue() {
    if (!this.remote) return;
    this.dirty = true;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.flush(), 1800);
  },
  async flush() {
    if (!this.remote || this.writing || !this.dirty) return;
    this.writing = true; this.dirty = false;
    try { await this.remote.set(JSON.parse(JSON.stringify(this.state))); }
    catch (e) { if (e && (e.code === 'invalid_argument' || e.code === 'revoked' || e.code === 'not_granted')) this.remote = null; }
    this.writing = false;
    if (this.dirty) this.queue();
  },
  async connect(onRemoteNewer) {
    try {
      const C = G.claude;
      if (!C || typeof C.use !== 'function') return;
      const [db, user] = await Promise.all([C.use('db'), C.use('user')]);
      if (!db || !user) return;
      const id = await user.id();
      if (!id) return;
      const ref = db.doc('data/users/' + id + '/progress');
      const snap = await ref.get();
      this.remote = ref;
      this.synced = true;
      if (snap.exists) {
        const data = snap.data();
        // compare against what this device loaded, so saves made while connecting never clobber newer account progress
        if ((data.updatedAt || 0) > (this.loadedAt || 0)) {
          this.state = migrate(merge(DEF(), JSON.parse(JSON.stringify(data))));
          try { localStorage.setItem(KEY, JSON.stringify(this.state)); } catch (e) { /* ignore */ }
          onRemoteNewer && onRemoteNewer();
        } else if ((this.state.updatedAt || 0) > (data.updatedAt || 0)) this.queue();
      } else if (this.state.updatedAt) this.queue();
    } catch (e) { this.remote = null; }
  },
  reset() { const s = this.state.settings; this.state = DEF(); this.state.settings = s; this.save(); },
});
UI.S = () => Store.state;

/* ---------------- voice ---------------- */
const Voice = (UI.Voice = {
  ok: typeof G.speechSynthesis !== 'undefined' && typeof G.SpeechSynthesisUtterance !== 'undefined',
  voices: [], speaking: false, onchange: null,
  init() {
    if (!this.ok) return;
    const load = () => { try { this.voices = G.speechSynthesis.getVoices().filter((v) => /^en/i.test(v.lang)); } catch (e) { this.voices = []; } };
    load();
    try { G.speechSynthesis.onvoiceschanged = load; } catch (e) { /* ignore */ }
  },
  pick() {
    const pref = Store.state.settings.voice;
    return this.voices.find((v) => v.name === pref)
      || this.voices.find((v) => /Samantha|Ava|Allison|Google US English|Aria|Jenny|Zoe|Serena|Karen/i.test(v.name))
      || this.voices.find((v) => /en-US/i.test(v.lang)) || this.voices[0];
  },
  say(text) {
    if (!this.ok) { UI.toast('Read-aloud is not available in this browser.'); return; }
    try {
      G.speechSynthesis.cancel();
      const u = new G.SpeechSynthesisUtterance(text);
      const v = this.pick(); if (v) u.voice = v;
      u.rate = Store.state.settings.rate || 1; u.pitch = 1.02;
      u.onend = u.onerror = () => { this.speaking = false; this.onchange && this.onchange(); };
      this.speaking = true; this.onchange && this.onchange();
      G.speechSynthesis.speak(u);
    } catch (e) { UI.toast('Read-aloud is not available here.'); }
  },
  stop() { if (this.ok) { try { G.speechSynthesis.cancel(); } catch (e) { /* ignore */ } } this.speaking = false; this.onchange && this.onchange(); },
});

/* ---------------- sound ---------------- */
const Sound = (UI.Sound = {
  ctx: null,
  ensure() { if (!this.ctx) { try { this.ctx = new (G.AudioContext || G.webkitAudioContext)(); } catch (e) { this.ctx = null; } } if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume(); return this.ctx; },
  tone(f, t, d, type = 'triangle', g = 0.07) {
    const c = this.ctx; const o = c.createOscillator(); const a = c.createGain();
    o.type = type; o.frequency.setValueAtTime(f, t);
    a.gain.setValueAtTime(0, t); a.gain.linearRampToValueAtTime(g, t + 0.012); a.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(a); a.connect(c.destination); o.start(t); o.stop(t + d + 0.02);
  },
  play(kind) {
    if (!Store.state.settings.sound) return;
    const c = this.ensure(); if (!c) return;
    const t = c.currentTime + 0.01;
    if (kind === 'good') { this.tone(784, t, 0.14); this.tone(988, t + 0.07, 0.14); this.tone(1319, t + 0.14, 0.24); }
    else if (kind === 'bad') { this.tone(220, t, 0.18, 'sine', 0.09); this.tone(165, t + 0.09, 0.22, 'sine', 0.08); }
    else if (kind === 'level') { [523, 659, 784, 1047, 1319].forEach((f, i) => this.tone(f, t + i * 0.08, 0.3, 'triangle', 0.06)); }
    else if (kind === 'tick') { this.tone(1400, t, 0.03, 'square', 0.015); }
    else if (kind === 'chime') { this.tone(880, t, 0.5, 'sine', 0.06); this.tone(1320, t + 0.2, 0.7, 'sine', 0.05); }
  },
});

/* ---------------- focus sound: brown noise (a steady, low rumble many ADHD brains focus better with) ---------------- */
UI.Noise = {
  src: null, gain: null, on: false,
  start() {
    const c = UI.Sound.ensure(); if (!c) return false;
    const rate = c.sampleRate, fade = Math.floor(rate * 0.5), len = rate * 6;
    const raw = new Float32Array(len + fade); let last = 0;
    for (let i = 0; i < raw.length; i++) { last = (last + 0.02 * (Math.random() * 2 - 1)) / 1.02; raw[i] = last * 3.5; }
    const buf = c.createBuffer(1, len, rate); const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = raw[i];
    for (let i = 0; i < fade; i++) { const t = i / fade; d[i] = raw[i] * t + raw[len + i] * (1 - t); } // seamless loop
    const src = c.createBufferSource(); src.buffer = buf; src.loop = true;
    const g = c.createGain(); g.gain.setValueAtTime(0, c.currentTime); g.gain.linearRampToValueAtTime(0.2, c.currentTime + 1.5);
    src.connect(g); g.connect(c.destination); src.start();
    this.src = src; this.gain = g; this.on = true; return true;
  },
  stop() {
    const c = UI.Sound.ctx, src = this.src;
    if (src && c) { try { this.gain.gain.cancelScheduledValues(c.currentTime); this.gain.gain.setValueAtTime(this.gain.gain.value, c.currentTime); this.gain.gain.linearRampToValueAtTime(0, c.currentTime + 0.5); setTimeout(() => { try { src.stop(); } catch (e) { /* already stopped */ } }, 600); } catch (e) { /* ignore */ } }
    this.src = null; this.on = false;
  },
  toggle() {
    if (this.on) this.stop(); else if (!this.start()) UI.toast('Sound is not available in this browser.');
    document.querySelectorAll('[data-act="noise"]').forEach((b) => b.setAttribute('aria-pressed', String(this.on)));
    return this.on;
  },
};

/* ---------------- toast ---------------- */
/** key: a newer message with the same key replaces the older one (e.g. "paused" replaces "started") */
UI.toast = function (html, ms = 2600, key) {
  let wrap = document.querySelector('.toast-wrap');
  if (!wrap) { wrap = document.createElement('div'); wrap.className = 'toast-wrap'; wrap.setAttribute('role', 'status'); wrap.setAttribute('aria-live', 'polite'); document.body.appendChild(wrap); }
  if (key) UI.toast.clear(key);
  while (wrap.children.length >= 2) wrap.firstElementChild.remove(); // never more than two messages at once
  const t = document.createElement('div'); t.className = 'toast'; t.innerHTML = html;
  if (key) t.dataset.key = key;
  wrap.appendChild(t);
  setTimeout(() => { t.style.transition = 'opacity .3s'; t.style.opacity = '0'; setTimeout(() => t.remove(), 320); }, ms);
};
UI.toast.clear = (key) => document.querySelectorAll(`.toast-wrap [data-key="${key}"]`).forEach((n) => n.remove());

/* ---------------- confetti ---------------- */
UI.confetti = function (n = 120) {
  if (G.matchMedia && G.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  let cv = document.getElementById('confetti');
  if (!cv) { cv = document.createElement('canvas'); cv.id = 'confetti'; document.body.appendChild(cv); }
  const ctx = cv.getContext('2d'); const dpr = G.devicePixelRatio || 1;
  cv.width = G.innerWidth * dpr; cv.height = G.innerHeight * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cs = getComputedStyle(document.documentElement);
  const cols = ['--pink', '--lav', '--mint', '--butter'].map((v) => cs.getPropertyValue(v).trim());
  const glyphs = ['∫', 'π', 'θ', 'dx', '+C', '√', 'e'];
  const P = Array.from({ length: n }, () => ({
    x: G.innerWidth / 2 + (Math.random() - 0.5) * 160, y: G.innerHeight * 0.38,
    vx: (Math.random() - 0.5) * 13, vy: -Math.random() * 13 - 4, r: Math.random() * Math.PI, vr: (Math.random() - 0.5) * 0.3,
    c: cols[Math.floor(Math.random() * cols.length)], g: Math.random() < 0.18 ? glyphs[Math.floor(Math.random() * glyphs.length)] : null, s: 6 + Math.random() * 6,
  }));
  let frame = 0;
  (function tick() {
    ctx.clearRect(0, 0, cv.width, cv.height);
    for (const p of P) {
      p.vy += 0.36; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr;
      ctx.save(); ctx.translate(p.x, p.y); ctx.rotate(p.r); ctx.fillStyle = p.c;
      if (p.g) { ctx.font = '600 18px KaTeX_Main, serif'; ctx.fillText(p.g, -5, 5); } else ctx.fillRect(-p.s / 2, -p.s / 4, p.s, p.s / 2);
      ctx.restore();
    }
    if (++frame < 150) requestAnimationFrame(tick); else ctx.clearRect(0, 0, cv.width, cv.height);
  })();
};

/* ---------------- misc ---------------- */
UI.css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();
UI.ring = function (pct, size = 68, stroke = 5, color = 'var(--u)') {
  const r = (size - stroke) / 2, c = 2 * Math.PI * r;
  return `<svg class="ring" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" aria-hidden="true"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="var(--line)" stroke-width="${stroke}" fill="none"/><circle cx="${size / 2}" cy="${size / 2}" r="${r}" stroke="${color}" stroke-width="${stroke}" fill="none" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${c * (1 - Math.max(0, Math.min(1, pct)))}" style="transition:stroke-dashoffset .8s cubic-bezier(.2,.8,.2,1)"/></svg>`;
};
UI.today = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
UI.streakDays = function () {
  const days = new Set(Store.state.days || []);
  let n = 0; const d = new Date();
  if (!days.has(UI.today())) d.setDate(d.getDate() - 1);
  for (;;) {
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    if (days.has(k)) { n++; d.setDate(d.getDate() - 1); } else break;
  }
  return n;
};
const RANKS = [[0, 'Integral Intern'], [150, 'Antiderivative Apprentice'], [450, 'Substitution Sorcerer'], [900, 'Parts Pro'], [1500, 'Calculus Captain'], [2400, 'A+ Legend']];
UI.rank = function (xp) { let r = RANKS[0], nx = null; for (let i = 0; i < RANKS.length; i++) if (xp >= RANKS[i][0]) { r = RANKS[i]; nx = RANKS[i + 1] || null; } return { name: r[1], floor: r[0], next: nx }; };
UI.letter = function (pct) { return pct >= 0.97 ? 'A+' : pct >= 0.93 ? 'A' : pct >= 0.9 ? 'A−' : pct >= 0.87 ? 'B+' : pct >= 0.83 ? 'B' : pct >= 0.8 ? 'B−' : pct >= 0.77 ? 'C+' : pct >= 0.7 ? 'C' : pct >= 0.6 ? 'D' : 'F'; };
UI.applyTheme = function () {
  const t = Store.state.settings.theme;
  if (t === 'light' || t === 'dark') document.documentElement.setAttribute('data-theme', t);
  else document.documentElement.removeAttribute('data-theme');
};
})(typeof globalThis !== 'undefined' ? globalThis : this);
