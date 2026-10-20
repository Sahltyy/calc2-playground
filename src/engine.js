/* ==========================================================================
   ENGINE — rationals, term builders, student-input parser, answer checking,
   mistake diagnosis, TeX → speech.  Pure functions, no DOM.
   ========================================================================== */
(function (G) {
'use strict';
const M = (G.M = G.M || {});

/* ---------------- seeded randomness ---------------- */
function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
M.rng = function (seed) {
  const s = seed == null ? (Math.random() * 4294967296) >>> 0 : seed >>> 0;
  const r = mulberry32(s);
  const api = {
    seed: s,
    next: r,
    int: (a, b) => a + Math.floor(r() * (b - a + 1)),
    pick: (arr) => arr[Math.floor(r() * arr.length)],
    chance: (p) => r() < p,
    sign: () => (r() < 0.5 ? -1 : 1),
    shuffle: (arr) => {
      const a = arr.slice();
      for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
      return a;
    },
    pickW: (pairs) => { // [[item, weight], ...]
      const tot = pairs.reduce((s, p) => s + p[1], 0); let x = r() * tot;
      for (const [it, w] of pairs) { if ((x -= w) < 0) return it; }
      return pairs[pairs.length - 1][0];
    },
  };
  return api;
};

/* ---------------- rationals ---------------- */
function gcd(a, b) { a = Math.abs(a); b = Math.abs(b); while (b) { [a, b] = [b, a % b]; } return a || 1; }
function Q(n, d = 1) {
  if (n && typeof n === 'object') return n;
  if (d === 0) throw new Error('Q: divide by zero');
  if (d < 0) { n = -n; d = -d; }
  const g = gcd(n, d);
  return { n: n / g, d: d / g };
}
Q.add = (a, b) => Q(a.n * b.d + b.n * a.d, a.d * b.d);
Q.sub = (a, b) => Q(a.n * b.d - b.n * a.d, a.d * b.d);
Q.mul = (a, b) => Q(a.n * b.n, a.d * b.d);
Q.div = (a, b) => Q(a.n * b.d, a.d * b.n);
Q.neg = (a) => Q(-a.n, a.d);
Q.abs = (a) => Q(Math.abs(a.n), a.d);
Q.val = (a) => a.n / a.d;
Q.isZero = (a) => a.n === 0;
Q.isOne = (a) => a.n === 1 && a.d === 1;
Q.isInt = (a) => a.d === 1;
Q.sgn = (a) => Math.sign(a.n);
Q.eq = (a, b) => a.n === b.n && a.d === b.d;
Q.tex = (a) => (a.d === 1 ? String(a.n) : (a.n < 0 ? '-' : '') + `\\frac{${Math.abs(a.n)}}{${a.d}}`);
Q.ascii = (a) => (a.d === 1 ? String(a.n) : `(${a.n}/${a.d})`);
M.Q = Q;

/* ---------------- term builders (tex + ascii + function) ---------------- */
// A "piece" is {tex, ascii, f}. A term is coefficient × pieces.
const P = (tex, ascii, f) => ({ tex, ascii, f });
M.P = P;
const TRIGF = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  sec: (x) => 1 / Math.cos(x), csc: (x) => 1 / Math.sin(x), cot: (x) => Math.cos(x) / Math.sin(x),
};
M.TRIGF = TRIGF;
const axTex = (a, v = 'x') => (a === 1 ? v : a === -1 ? '-' + v : `${a}${v}`);
const axAscii = (a, v = 'x') => (a === 1 ? v : a === -1 ? '-' + v : `${a}${v}`);
M.axTex = axTex;
const vTex = (v) => (v === 'θ' ? '\\theta' : v);
const vAscii = (v) => (v === 'θ' ? 'theta' : v);

M.pc = {
  num: (q) => P(Q.tex(Q(q)), Q.ascii(Q(q)), () => Q.val(Q(q))),
  // variable to a power (v = 'x' | 'u' | 'θ')
  X: (p = 1, v = 'x') => (p === 1 ? P(vTex(v), vAscii(v), (x) => x)
    : P(`${vTex(v)}^{${p}}`, `${vAscii(v)}^${p < 0 || !Number.isInteger(p) ? '(' + p + ')' : p}`, (x) => Math.pow(x, p))),
  E: (a, v = 'x') => P(`e^{${axTex(a, vTex(v))}}`, `e^(${axAscii(a, vAscii(v))})`, (x) => Math.exp(a * x)),
  // trig function of a·v raised to p
  Trig: (name, a = 1, p = 1, v = 'x') => {
    const simple = a === 1;
    const arg = axTex(a, vTex(v));
    const tex = p === 1
      ? (simple ? `\\${name} ${vTex(v)}` : `\\${name}(${arg})`)
      : (simple ? `\\${name}^{${p}} ${vTex(v)}` : `\\${name}^{${p}}(${arg})`);
    const ascii = p === 1 ? `${name}(${axAscii(a, vAscii(v))})` : `${name}(${axAscii(a, vAscii(v))})^${p}`;
    const g = TRIGF[name];
    return P(tex, ascii, p === 1 ? (x) => g(a * x) : (x) => Math.pow(g(a * x), p));
  },
  Ln: (inner, abs = true) => P(
    abs ? `\\ln\\left|${inner.tex}\\right|` : `\\ln\\left(${inner.tex}\\right)`,
    abs ? `ln(abs(${inner.ascii}))` : `ln(${inner.ascii})`,
    abs ? (x) => Math.log(Math.abs(inner.f(x))) : (x) => Math.log(inner.f(x))),
  LnX: () => P('\\ln x', 'ln(x)', (x) => Math.log(x)),
  Sqrt: (inner) => P(`\\sqrt{${inner.tex}}`, `sqrt(${inner.ascii})`, (x) => Math.sqrt(inner.f(x))),
  Arc: (name, inner) => {
    const T = { arcsin: '\\arcsin', arccos: '\\arccos', arctan: '\\arctan', arcsec: '\\operatorname{arcsec}' };
    const F = { arcsin: Math.asin, arccos: Math.acos, arctan: Math.atan, arcsec: (z) => Math.acos(1 / z) };
    const bare = inner.tex === 'x';
    return P(bare ? `${T[name]} x` : `${T[name]}\\left(${inner.tex}\\right)`, `${name}(${inner.ascii})`, (x) => F[name](inner.f(x)));
  },
  Paren: (inner) => P(`\\left(${inner.tex}\\right)`, `(${inner.ascii})`, inner.f),
  Frac: (num, den) => P(`\\frac{${num.tex}}{${den.tex}}`, `(${num.ascii})/(${den.ascii})`, (x) => num.f(x) / den.f(x)),
  Pow: (base, p) => P(`\\left(${base.tex}\\right)^{${p}}`, `(${base.ascii})^(${p})`, (x) => Math.pow(base.f(x), p)),
  Raw: (tex, ascii, f) => P(tex, ascii, f),
};

/** A term = coefficient (rational) × pieces. style 'over' writes c=1/d as \frac{body}{d}. */
M.term = function (c, pieces = [], style) {
  c = Q(c);
  pieces = pieces.filter(Boolean);
  const bodyTex = pieces.map((p) => p.tex).join('\\,');
  const bodyAscii = pieces.map((p) => p.ascii).join('*');
  const fs = pieces.map((p) => p.f);
  const cv = Q.val(c);
  const f = fs.length === 0 ? () => cv
    : fs.length === 1 ? (x) => cv * fs[0](x)
    : (x) => { let v = cv; for (const g of fs) v *= g(x); return v; };
  return { c, bodyTex, bodyAscii, f, style, pieces };
};
// TeX of |term| (sign handled by caller)
function unsignedTermTex(t) {
  const a = Q.abs(t.c);
  if (!t.bodyTex) return Q.tex(a);
  if (Q.isOne(a)) return t.bodyTex;
  if (t.style === 'over' && a.d !== 1) {
    const num = a.n === 1 ? t.bodyTex : `${a.n}${t.bodyTex}`;
    return `\\frac{${num}}{${a.d}}`;
  }
  return Q.tex(a) + t.bodyTex;
}
function unsignedTermAscii(t) {
  const a = Q.abs(t.c);
  if (!t.bodyAscii) return Q.ascii(a).replace(/[()]/g, '');
  if (Q.isOne(a)) return t.bodyAscii;
  return `${Q.ascii(a)}*${t.bodyAscii}`;
}
M.termTex = (t) => (Q.sgn(t.c) < 0 ? '-' : '') + unsignedTermTex(t);
/** Sum of terms → {tex, ascii, f, terms}. Zero terms are dropped. */
M.sum = function (terms) {
  terms = terms.filter((t) => t && !Q.isZero(t.c));
  let tex = '', ascii = '';
  terms.forEach((t, i) => {
    const neg = Q.sgn(t.c) < 0;
    if (i === 0) { tex += (neg ? '-' : '') + unsignedTermTex(t); ascii += (neg ? '-' : '') + unsignedTermAscii(t); }
    else { tex += (neg ? ' - ' : ' + ') + unsignedTermTex(t); ascii += (neg ? ' - ' : ' + ') + unsignedTermAscii(t); }
  });
  if (!terms.length) { tex = '0'; ascii = '0'; }
  const fs = terms.map((t) => t.f);
  return { tex, ascii, f: (x) => { let s = 0; for (const g of fs) s += g(x); return s; }, terms };
};
/** Polynomial with integer coeffs (descending) → {tex, ascii, f} */
M.poly = function (coeffs, v = 'x') {
  const deg = coeffs.length - 1;
  const terms = coeffs.map((c, i) => {
    const p = deg - i;
    return M.term(c, p === 0 ? [] : [M.pc.X(p, v)]);
  });
  const s = M.sum(terms);
  return { tex: s.tex, ascii: s.ascii, f: (x) => coeffs.reduce((acc, c) => acc * x + c, 0) };
};
/** (x - r) style linear factor */
M.lin = function (r, v = 'x', a = 1) {
  // a·v − r
  const t = M.sum([M.term(a, [M.pc.X(1, v)]), M.term(-r)]);
  return { tex: t.tex, ascii: t.ascii, f: (x) => a * x - r };
};

/* ---------------- student-input parser ---------------- */
const FN_WORDS = [
  ['arcsinh', 'asinh'], ['arccosh', 'acosh'], ['arctanh', 'atanh'],
  ['arcsin', 'asin'], ['arccos', 'acos'], ['arctan', 'atan'], ['arcsec', 'asec'], ['arccsc', 'acsc'], ['arccot', 'acot'],
  ['asinh', 'asinh'], ['acosh', 'acosh'], ['atanh', 'atanh'],
  ['asin', 'asin'], ['acos', 'acos'], ['atan', 'atan'], ['asec', 'asec'], ['acsc', 'acsc'], ['acot', 'acot'],
  ['sinh', 'sinh'], ['cosh', 'cosh'], ['tanh', 'tanh'],
  ['cosec', 'csc'], ['sqrt', 'sqrt'], ['root', 'sqrt'],
  ['sin', 'sin'], ['cos', 'cos'], ['tan', 'tan'], ['sec', 'sec'], ['csc', 'csc'], ['cot', 'cot'],
  ['ln', 'ln'], ['log', 'ln'], ['exp', 'exp'], ['abs', 'abs'],
];
const WORDS = FN_WORDS.map(([w, v]) => ({ w, t: 'fn', v }))
  .concat([{ w: 'theta', t: 'var', v: 'θ' }, { w: 'pi', t: 'const', v: 'pi' }])
  .sort((a, b) => b.w.length - a.w.length);
const INVERSE = { sin: 'asin', cos: 'acos', tan: 'atan', sec: 'asec', csc: 'acsc', cot: 'acot', sinh: 'asinh', cosh: 'acosh', tanh: 'atanh' };
const FNS = {
  sin: Math.sin, cos: Math.cos, tan: Math.tan,
  sec: (x) => 1 / Math.cos(x), csc: (x) => 1 / Math.sin(x), cot: (x) => Math.cos(x) / Math.sin(x),
  asin: Math.asin, acos: Math.acos, atan: Math.atan,
  asec: (x) => Math.acos(1 / x), acsc: (x) => Math.asin(1 / x), acot: (x) => Math.PI / 2 - Math.atan(x),
  sinh: Math.sinh, cosh: Math.cosh, tanh: Math.tanh, asinh: Math.asinh, acosh: Math.acosh, atanh: Math.atanh,
  ln: Math.log, exp: Math.exp, sqrt: Math.sqrt, abs: Math.abs,
};
const FN_TEX = {
  sin: '\\sin', cos: '\\cos', tan: '\\tan', sec: '\\sec', csc: '\\csc', cot: '\\cot',
  asin: '\\arcsin', acos: '\\arccos', atan: '\\arctan', asec: '\\operatorname{arcsec}', acsc: '\\operatorname{arccsc}', acot: '\\operatorname{arccot}',
  sinh: '\\sinh', cosh: '\\cosh', tanh: '\\tanh', asinh: '\\operatorname{arcsinh}', acosh: '\\operatorname{arccosh}', atanh: '\\operatorname{arctanh}',
  ln: '\\ln', exp: '\\exp', sqrt: '\\sqrt', abs: '\\operatorname{abs}',
};

function normalizeInput(s) {
  return String(s)
    .replace(/[−–—]/g, '-').replace(/[×·∙⋅]/g, '*').replace(/÷/g, '/')
    .replace(/π/g, ' pi ').replace(/[θϑ]/g, ' theta ').replace(/√/g, ' sqrt ')
    .replace(/⁻¹/g, '^-1').replace(/²/g, '^2').replace(/³/g, '^3').replace(/⁴/g, '^4').replace(/⁵/g, '^5').replace(/⁶/g, '^6')
    .replace(/\*\*/g, '^').replace(/\\left|\\right/g, '')
    .replace(/\\(cdot|times)/g, '*').replace(/\\(theta|pi|sin|cos|tan|sec|csc|cot|ln|arcsin|arccos|arctan|sqrt)/g, ' $1 ');
}

function tokenize(src) {
  const s = normalizeInput(src);
  const toks = [];
  let i = 0, ws = false;
  while (i < s.length) {
    const ch = s[i];
    if (/\s/.test(ch)) { ws = true; i++; continue; }
    if (/[0-9.]/.test(ch)) {
      const m = /^(\d+\.?\d*|\.\d+)/.exec(s.slice(i));
      if (!m) throw perr(`I can't read the number near "${s.slice(i, i + 4)}"`, i);
      toks.push({ t: 'num', v: m[1], pos: i, ws }); i += m[1].length; ws = false; continue;
    }
    if (/[a-zA-Z]/.test(ch)) {
      const m = /^[a-zA-Z]+/.exec(s.slice(i));
      const run = m[0].toLowerCase();
      let j = 0, first = true;
      while (j < run.length) {
        let w = null;
        for (const cand of WORDS) if (run.startsWith(cand.w, j)) { w = cand; break; }
        if (w) { toks.push({ t: w.t, v: w.v, pos: i + j, ws: first ? ws : false }); j += w.w.length; first = false; continue; }
        const c = run[j];
        const tok = c === 'x' ? { t: 'var', v: 'x' } : c === 'u' ? { t: 'var', v: 'u' } : c === 't' ? { t: 'var', v: 't' }
          : c === 'e' ? { t: 'const', v: 'e' } : (c === 'c' || c === 'k') ? { t: 'const', v: 'C' }
          : { t: 'unknown', v: m[0][j] };
        tok.pos = i + j; tok.ws = first ? ws : false;
        toks.push(tok); j++; first = false;
      }
      i += run.length; ws = false; continue;
    }
    if ('+-*/^'.includes(ch)) { toks.push({ t: 'op', v: ch, pos: i, ws }); i++; ws = false; continue; }
    if ('([{'.includes(ch)) { toks.push({ t: '(', pos: i, ws }); i++; ws = false; continue; }
    if (')]}'.includes(ch)) { toks.push({ t: ')', pos: i, ws }); i++; ws = false; continue; }
    if (ch === '|') { toks.push({ t: '|', pos: i, ws }); i++; ws = false; continue; }
    if (ch === '=') { // allow "F(x) = ..." or "y = ..." prefixes: drop everything before '='
      toks.length = 0; i++; ws = false; continue;
    }
    if (ch === ',') { throw perr('Use a dot for decimals and * for multiplication — commas confuse me.', i); }
    throw perr(`I don't know the symbol "${ch}"`, i);
  }
  toks.push({ t: 'end', pos: s.length });
  return toks;
}
function perr(msg, pos) { const e = new Error(msg); e.pos = pos; e.parse = true; return e; }

function parseTokens(toks) {
  let i = 0, absDepth = 0;
  const peek = () => toks[i];
  const next = () => toks[i++];
  const isOp = (t, v) => t.t === 'op' && t.v === v;
  const expectClose = () => {
    const t = peek();
    if (t.t === ')') { next(); return; }
    if (t.t === 'end') return; // forgive a missing ")" at the very end
    throw perr('A parenthesis looks unbalanced.', t.pos);
  };
  function parseExpr() {
    let left = parseTerm();
    for (;;) {
      const t = peek();
      if (isOp(t, '+') || isOp(t, '-')) { next(); const right = parseTerm(); left = { type: t.v === '+' ? 'add' : 'sub', a: left, b: right }; }
      else return left;
    }
  }
  function startsFactor(t) {
    return t.t === 'num' || t.t === 'var' || t.t === 'const' || t.t === 'fn' || t.t === '(' || (t.t === '|' && absDepth === 0) || t.t === 'unknown';
  }
  function parseTerm() {
    let left = parseUnary();
    for (;;) {
      const t = peek();
      if (isOp(t, '*') || isOp(t, '/')) { next(); const right = parseUnary(); left = { type: t.v === '*' ? 'mul' : 'div', a: left, b: right }; }
      else if (startsFactor(t)) { const right = parsePower(); left = { type: 'mul', a: left, b: right, imp: true }; }
      else return left;
    }
  }
  function parseUnary() {
    const t = peek();
    if (isOp(t, '-') || isOp(t, '+')) { next(); const a = parseUnary(); return t.v === '-' ? { type: 'neg', a } : a; }
    return parsePower();
  }
  function parsePower() {
    const base = parsePrimary();
    if (isOp(peek(), '^')) { next(); return { type: 'pow', a: base, b: parseExponent() }; }
    return base;
  }
  function parseExponent() {
    let neg = false;
    if (isOp(peek(), '-') || isOp(peek(), '+')) { neg = next().v === '-'; }
    let e;
    const p = peek();
    if (p.t === 'num') {
      next(); e = { type: 'num', v: p.v };
      const q = peek(); // e^2x  → e^(2x)
      if (q.t === 'var' && !q.ws) { next(); e = { type: 'mul', a: e, b: { type: 'var', name: q.v }, imp: true }; }
    } else if (p.t === 'end') {
      throw perr('Something is missing after ^', p.pos);
    } else e = parsePrimary();
    if (isOp(peek(), '^')) { next(); e = { type: 'pow', a: e, b: parseExponent() }; }
    return neg ? { type: 'neg', a: e } : e;
  }
  function parsePrimary() {
    const t = next();
    switch (t.t) {
      case 'num': return { type: 'num', v: t.v };
      case 'var': return { type: 'var', name: t.v };
      case 'const': return { type: 'const', name: t.v };
      case '(': {
        const save = absDepth; absDepth = 0;
        if (peek().t === ')') throw perr('Empty parentheses ()', t.pos);
        const e = parseExpr(); absDepth = save; expectClose(); return e;
      }
      case '|': {
        absDepth++; const e = parseExpr(); absDepth--;
        if (peek().t !== '|') throw perr('Close the absolute value with another |', peek().pos);
        next(); return { type: 'abs', a: e };
      }
      case 'fn': return parseFn(t.v);
      case 'unknown': throw perr(`I don't know "${t.v}". Variables allowed here: see the hint under the box.`, t.pos);
      case 'end': throw perr('Looks like something is missing at the end.', t.pos);
      case ')': throw perr('Extra ")" — check your parentheses.', t.pos);
      case 'op': throw perr(`Two operators in a row near "${t.v}"`, t.pos);
      default: throw perr('I could not read that.', t.pos);
    }
  }
  function parseFn(name) {
    let power = null;
    if (isOp(peek(), '^')) {
      next();
      if (peek().t === '(') { next(); power = parseExpr(); expectClose(); }
      else {
        let neg = false;
        if (isOp(peek(), '-')) { next(); neg = true; }
        const n = next();
        if (n.t !== 'num') throw perr('After a function power write a number, like sin^2(x)', n.pos);
        power = { type: 'num', v: n.v };
        if (neg) power = { type: 'neg', a: power };
      }
      const pv = constValue(power);
      if (pv === -1 && INVERSE[name]) { name = INVERSE[name]; power = null; }
    }
    let arg;
    const t = peek();
    if (t.t === '(') {
      next(); const save = absDepth; absDepth = 0;
      if (peek().t === ')') throw perr(`${name}() needs something inside`, t.pos);
      arg = parseExpr(); absDepth = save; expectClose();
    } else if (t.t === '|') {
      next(); absDepth++; const inner = parseExpr(); absDepth--;
      if (peek().t !== '|') throw perr('Close the absolute value with another |', peek().pos);
      next(); arg = { type: 'abs', a: inner };
    } else arg = parseChain(name);
    let node;
    if (name === 'exp') node = { type: 'pow', a: { type: 'const', name: 'e' }, b: arg };
    else if (name === 'abs') node = { type: 'abs', a: arg };
    else node = { type: 'fn', name, a: arg };
    if (power) node = { type: 'pow', a: node, b: power, fnpow: true };
    return node;
  }
  function parseChain(name) {
    const atoms = [];
    for (;;) {
      const t = peek();
      if (t.t === 'num' || t.t === 'var' || t.t === 'const') {
        if (atoms.length && t.t === 'num') break;
        if (t.t === 'const' && t.v === 'C') break;
        next();
        let a = t.t === 'num' ? { type: 'num', v: t.v } : t.t === 'var' ? { type: 'var', name: t.v } : { type: 'const', name: t.v };
        if (isOp(peek(), '^')) { next(); a = { type: 'pow', a, b: parseExponent() }; }
        atoms.push(a);
      } else break;
    }
    if (!atoms.length) throw perr(`${name} needs an input, like ${name}(x)`, peek().pos);
    return atoms.reduce((l, r) => ({ type: 'mul', a: l, b: r, imp: true }));
  }
  const ast = parseExpr();
  if (peek().t !== 'end') {
    const t = peek();
    throw perr(t.t === ')' ? 'Extra ")" — check your parentheses.' : 'I got lost near the end — check that part.', t.pos);
  }
  return ast;
}
function constValue(n) {
  if (!n) return null;
  if (n.type === 'num') return +n.v;
  if (n.type === 'neg') { const v = constValue(n.a); return v == null ? null : -v; }
  return null;
}

/** Walk helpers */
function walk(n, fn) { if (!n) return; fn(n); if (n.a) walk(n.a, fn); if (n.b) walk(n.b, fn); }
function varsUsed(ast) { const s = new Set(); walk(ast, (n) => { if (n.type === 'var') s.add(n.name); }); return s; }
function hasC(ast) { let c = false; walk(ast, (n) => { if (n.type === 'const' && n.name === 'C') c = true; }); return c; }
function fnsUsed(ast) { const s = new Set(); walk(ast, (n) => { if (n.type === 'fn') s.add(n.name); }); return s; }

/**
 * Parse student input.
 * opts.vars: allowed variable names, e.g. ['x'] or ['θ'] or ['u'].  't' is treated as θ.
 * Returns {ok, ast, tex, hasC, error, code}
 */
M.parse = function (src, opts = {}) {
  const allowed = opts.vars || ['x'];
  const raw = String(src || '').trim();
  if (!raw) return { ok: false, empty: true, error: '' };
  try {
    const toks = tokenize(raw);
    for (const t of toks) if (t.t === 'var' && t.v === 't') t.v = 'θ';
    if (toks.length === 1) return { ok: false, empty: true, error: '' };
    const ast = parseTokens(toks);
    const used = varsUsed(ast);
    for (const v of used) {
      if (!allowed.includes(v)) {
        let msg = `Use ${allowed.map((a) => (a === 'θ' ? 'θ' : a)).join(' or ')} here, not ${v}.`;
        let code = 'var';
        if (v === 'u' && allowed.includes('x')) { msg = 'Your answer still has u in it — back-substitute so it is all in x.'; code = 'backsub'; }
        if (v === 'θ' && allowed.includes('x')) { msg = 'Your answer still has θ in it — use the triangle to get back to x.'; code = 'backsub'; }
        if (v === 'x' && allowed.includes('θ')) { msg = 'This step lives in θ-world — write it with θ (type theta or t).'; code = 'var'; }
        if (v === 'x' && allowed.includes('u')) { msg = 'Write this step in terms of u.'; code = 'var'; }
        return { ok: false, error: msg, code, ast, tex: M.toTeX(ast) };
      }
    }
    return { ok: true, ast, tex: M.toTeX(ast), hasC: hasC(ast), fns: fnsUsed(ast) };
  } catch (e) {
    if (e && e.parse) return { ok: false, error: e.message, pos: e.pos };
    return { ok: false, error: 'I could not read that.' };
  }
};

/* ---------------- compile to a JS function ---------------- */
function powr(a, b) {
  if (a < 0 && !Number.isInteger(b)) {
    // allow odd roots like x^(1/3)
    const inv = 1 / b;
    if (Number.isInteger(Math.round(inv)) && Math.abs(inv - Math.round(inv)) < 1e-9 && Math.round(inv) % 2 !== 0) return -Math.pow(-a, b);
    return NaN;
  }
  return Math.pow(a, b);
}
M.compile = function (ast) {
  function c(n) {
    switch (n.type) {
      case 'num': { const v = +n.v; return () => v; }
      case 'var': { const k = n.name; return (env) => env[k]; }
      case 'const': { const v = n.name === 'pi' ? Math.PI : n.name === 'e' ? Math.E : 0; return () => v; }
      case 'neg': { const a = c(n.a); return (e) => -a(e); }
      case 'add': { const a = c(n.a), b = c(n.b); return (e) => a(e) + b(e); }
      case 'sub': { const a = c(n.a), b = c(n.b); return (e) => a(e) - b(e); }
      case 'mul': { const a = c(n.a), b = c(n.b); return (e) => a(e) * b(e); }
      case 'div': { const a = c(n.a), b = c(n.b); return (e) => a(e) / b(e); }
      case 'pow': {
        if (n.a.type === 'const' && n.a.name === 'e') { const b = c(n.b); return (e) => Math.exp(b(e)); }
        const a = c(n.a), b = c(n.b); return (e) => powr(a(e), b(e));
      }
      case 'abs': { const a = c(n.a); return (e) => Math.abs(a(e)); }
      case 'fn': { const a = c(n.a); const g = FNS[n.name]; return (e) => g(a(e)); }
      default: return () => NaN;
    }
  }
  return c(ast);
};
/** compile to a one-variable function */
M.fnOf = function (ast, v = 'x') { const g = M.compile(ast); return (x) => g({ [v]: x }); };

/* ---------------- AST → TeX (live preview) ---------------- */
function leftmost(n) { while (n && (n.type === 'mul' || n.type === 'div' || n.type === 'add' || n.type === 'sub' || (n.type === 'pow' && !n.fnpow))) n = n.a; return n; }
M.toTeX = function (ast) {
  const isAddSub = (n) => n.type === 'add' || n.type === 'sub';
  const wrap = (s) => `\\left(${s}\\right)`;
  function argTex(a) { return a.type === 'abs' ? `\\left|${t(a.a)}\\right|` : wrap(t(a)); }
  function t(n) {
    switch (n.type) {
      case 'num': return n.v;
      case 'var': return n.name === 'θ' ? '\\theta' : n.name;
      case 'const': return n.name === 'pi' ? '\\pi' : n.name === 'e' ? 'e' : 'C';
      case 'add': return `${t(n.a)} + ${t(n.b)}`;
      case 'sub': return `${t(n.a)} - ${isAddSub(n.b) ? wrap(t(n.b)) : t(n.b)}`;
      case 'neg': return `-${isAddSub(n.a) ? wrap(t(n.a)) : t(n.a)}`;
      case 'mul': {
        const L = isAddSub(n.a) ? wrap(t(n.a)) : t(n.a);
        const R = isAddSub(n.b) || n.b.type === 'neg' ? wrap(t(n.b)) : t(n.b);
        const lm = leftmost(n.b);
        const dot = lm && lm.type === 'num';
        return L + (dot ? ' \\cdot ' : '\\,') + R;
      }
      case 'div': return `\\frac{${t(n.a)}}{${t(n.b)}}`;
      case 'pow': {
        if (n.fnpow) return `${FN_TEX[n.a.name] || n.a.name}^{${t(n.b)}}${argTex(n.a.a)}`;
        const a = n.a;
        const atomic = a.type === 'num' || a.type === 'var' || a.type === 'const';
        return `${atomic ? t(a) : wrap(t(a))}^{${t(n.b)}}`;
      }
      case 'abs': return `\\left|${t(n.a)}\\right|`;
      case 'fn':
        if (n.name === 'sqrt') return `\\sqrt{${t(n.a)}}`;
        return (FN_TEX[n.name] || n.name) + argTex(n.a);
      default: return '?';
    }
  }
  return t(ast);
};

/** Split an AST into top-level signed terms (for term-by-term grading) */
M.splitTerms = function (ast) {
  const out = [];
  (function go(n, sign) {
    if (n.type === 'add') { go(n.a, sign); go(n.b, sign); }
    else if (n.type === 'sub') { go(n.a, sign); go(n.b, -sign); }
    else if (n.type === 'neg' && (n.a.type === 'add' || n.a.type === 'sub')) go(n.a, -sign);
    else out.push(sign < 0 ? { type: 'neg', a: n } : n);
  })(ast, 1);
  return out;
};

/* ---------------- numeric comparison ---------------- */
M.points = function (domain, n = 9, seed = 7) {
  const [lo, hi] = domain;
  const r = M.rng(seed);
  const pts = [];
  for (let k = 0; k < n; k++) { const t = (k + 0.2 + 0.6 * r.next()) / n; pts.push(lo + (hi - lo) * t); }
  return pts;
};
const fin = Number.isFinite;
/** F and G differ by a constant on these points? */
M.equivConst = function (F, G, pts, tol = 1e-7) {
  let d0 = null, scale = 1, used = 0, undefinedAt = null;
  for (const x of pts) {
    const b = G(x);
    if (!fin(b)) continue;
    const a = F(x);
    if (!fin(a)) { undefinedAt = x; return { ok: false, undefined: true, x }; }
    scale = Math.max(scale, Math.abs(a), Math.abs(b));
    const d = a - b;
    if (d0 === null) d0 = d;
    else if (Math.abs(d - d0) > tol * scale) return { ok: false };
    used++;
  }
  return { ok: used >= 3, c: d0, undefinedAt };
};
/** F equals G exactly on these points? */
M.equalFns = function (F, G, pts, tol = 1e-7) {
  let used = 0;
  for (const x of pts) {
    const b = G(x); if (!fin(b)) continue;
    const a = F(x); if (!fin(a)) return false;
    if (Math.abs(a - b) > tol * Math.max(1, Math.abs(b))) return false;
    used++;
  }
  return used >= 3;
};
M.deriv = function (F, x) {
  const h = 1e-3 * Math.max(1, Math.abs(x));
  return (-F(x + 2 * h) + 8 * F(x + h) - 8 * F(x - h) + F(x - 2 * h)) / (12 * h);
};
/** F' == f on these points? */
M.derivMatches = function (F, f, pts, tol = 2e-5) {
  let used = 0;
  for (const x of pts) {
    const t = f(x); if (!fin(t)) continue;
    const d = M.deriv(F, x); if (!fin(d)) return false;
    if (Math.abs(d - t) > tol * Math.max(1, Math.abs(t))) return false;
    used++;
  }
  return used >= 3;
};
/** F' / f constant? returns k or null */
M.derivRatio = function (F, f, pts) {
  let k = null;
  for (const x of pts) {
    const t = f(x); if (!fin(t) || Math.abs(t) < 1e-6) continue;
    const d = M.deriv(F, x); if (!fin(d)) return null;
    const r = d / t;
    if (k === null) k = r; else if (Math.abs(r - k) > 1e-4 * Math.max(1, Math.abs(k))) return null;
  }
  return k;
};
/** Nice name for a constant factor */
M.niceNumber = function (v) {
  for (let d = 1; d <= 64; d++) {
    const n = Math.round(v * d);
    if (Math.abs(n / d - v) < 1e-6) return d === 1 ? String(n) : `${n}/${d}`;
  }
  return v.toFixed(3);
};
/** Recognize a decimal as an exact-looking value (calculator helper) */
M.recognize = function (v) {
  if (!fin(v)) return null;
  const cands = [];
  for (let d = 1; d <= 48; d++) { const n = Math.round(v * d); if (n !== 0 && Math.abs(n / d - v) < 1e-10 * Math.max(1, Math.abs(v))) { cands.push({ tex: d === 1 ? `${n}` : `${n < 0 ? '-' : ''}\\frac{${Math.abs(n)}}{${d}}` }); break; } }
  if (!cands.length) {
    const p = v / Math.PI;
    for (let d = 1; d <= 24; d++) { const n = Math.round(p * d); if (n !== 0 && Math.abs(n / d - p) < 1e-10) { const a = Math.abs(n); cands.push({ tex: `${n < 0 ? '-' : ''}${d === 1 ? (a === 1 ? '' : a) + '\\pi' : `\\frac{${a === 1 ? '' : a}\\pi}{${d}}`}` }); break; } }
  }
  if (!cands.length) {
    for (const r of [2, 3, 5, 6, 7]) {
      const s = v / Math.sqrt(r);
      for (let d = 1; d <= 12; d++) { const n = Math.round(s * d); if (n !== 0 && Math.abs(n / d - s) < 1e-10) { const a = Math.abs(n); cands.push({ tex: `${n < 0 ? '-' : ''}${d === 1 ? (a === 1 ? '' : a) + `\\sqrt{${r}}` : `\\frac{${a === 1 ? '' : a}\\sqrt{${r}}}{${d}}`}` }); break; } }
      if (cands.length) break;
    }
  }
  return cands.length ? cands[0].tex : null;
};

/* ---------------- grading ---------------- */
/**
 * Grade a typed antiderivative against a problem.
 * problem.answer = {f: F(x), terms:[{tex, f}], tex}
 * problem.f = integrand,  problem.domain, problem.absDomain (optional),  problem.mistakes = [{f, tag, msg, step}]
 * Returns {verdict: 'correct'|'almost'|'wrong'|'invalid', score, outOf, notes:[{ok,text}], diagnosis, tags}
 */
M.gradeAntiderivative = function (input, problem, outOf = 12) {
  const parsed = M.parse(input, { vars: ['x'] });
  if (!parsed.ok) {
    if (parsed.code === 'backsub') return { verdict: 'wrong', score: Math.round(outOf * 0.6), outOf, notes: [{ ok: false, text: parsed.error }], diagnosis: { tag: 'backsub', msg: parsed.error, step: problem.backsubStep ?? null }, tags: ['backsub'], parsed };
    return { verdict: 'invalid', score: 0, outOf, notes: [{ ok: false, text: parsed.error || 'Type your answer first.' }], parsed };
  }
  const F = M.fnOf(parsed.ast, 'x');
  const pts = M.points(problem.domain, 9, 11);
  const Ft = problem.answer.f;
  let eq = M.equivConst(F, Ft, pts);
  let correct = eq.ok;
  if (!correct && !eq.undefined) correct = M.derivMatches(F, problem.f, pts);
  const notes = [], tags = [];
  if (correct) {
    let score = outOf;
    notes.push({ ok: true, text: 'Antiderivative checks out: its derivative gives back the integrand.' });
    // absolute value check
    if (problem.absDomain) {
      const p2 = M.points(problem.absDomain, 7, 5);
      const okAbs = p2.every((x) => !fin(Ft(x)) || fin(F(x)));
      if (!okAbs) { score -= 1; notes.push({ ok: false, text: 'Missing absolute value bars inside ln — write ln|…|, or it breaks where the inside goes negative. (−1)' }); tags.push('abs'); }
    }
    if (!parsed.hasC) { score -= 1; notes.push({ ok: false, text: 'Missing +C. Indefinite integral = +C every single time. (−1)' }); tags.push('plusC'); }
    else notes.push({ ok: true, text: '+C is there.' });
    return { verdict: score === outOf ? 'correct' : 'almost', score, outOf, notes, tags, parsed, diagnosis: null };
  }
  // ---- wrong: diagnose ----
  let diagnosis = null;
  if (eq.undefined && !M.derivMatches(F, problem.f, pts.filter((x) => fin(F(x))))) {
    // undefined somewhere on the domain
  }
  for (const m of problem.mistakes || []) {
    if (M.equivConst(F, m.f, pts).ok) { diagnosis = { tag: m.tag, msg: m.msg, step: m.step ?? null }; break; }
  }
  if (!diagnosis) {
    if (M.equivConst(F, (x) => -Ft(x), pts).ok) diagnosis = { tag: 'sign', msg: 'Every sign is flipped — your answer is the negative of the right one. Check the sign when you integrated (∫sin = −cos, and the minus in the formula).', step: null };
    else {
      const k = M.derivRatio(F, problem.f, pts);
      if (k !== null && Math.abs(k - 1) > 1e-6 && Math.abs(k) > 1e-6) diagnosis = { tag: 'kfactor', msg: `Your answer is off by a constant factor: its derivative is ${M.niceNumber(k)} × the integrand. Usually that's a missing 1/k when integrating e^{kx}, sin(kx) or cos(kx), or a dropped coefficient.`, step: null };
      else {
        const fd = (x) => M.deriv(problem.f, x);
        if (M.equalFns(F, fd, pts, 1e-4)) diagnosis = { tag: 'direction', msg: 'That is the DERIVATIVE of the integrand. We need to go the other way — the antiderivative.', step: null };
      }
    }
  }
  // term-by-term marks (partial credit)
  const uterms = M.splitTerms(parsed.ast).map((a) => M.fnOf(a, 'x'));
  const marks = (problem.answer.terms || []).map((t) => ({ tex: M.termTex(t), ok: uterms.some((u) => M.equalFns(u, t.f, pts, 1e-6)) }));
  const nOk = marks.filter((m) => m.ok).length;
  let score = 0;
  if (marks.length) score = Math.floor(((outOf - 2) * nOk) / marks.length);
  if (diagnosis && diagnosis.step != null && problem.steps) {
    const before = problem.steps.slice(0, diagnosis.step).reduce((s, st) => s + (st.check ? st.check.points || 0 : 0), 0);
    score = Math.max(score, Math.min(outOf - 3, before));
  }
  if (parsed.hasC && score > 0) score += 1;
  marks.forEach((m, i) => notes.push({ ok: m.ok, text: `Term ${i + 1}: $${m.tex}$ ${m.ok ? 'is in your answer ✓' : 'is missing or off'}`, term: true }));
  if (!parsed.hasC) { notes.push({ ok: false, text: 'And no +C.' }); tags.push('plusC'); }
  if (diagnosis) tags.unshift(diagnosis.tag);
  return { verdict: 'wrong', score: Math.max(0, Math.min(outOf - 2, score)), outOf, notes, diagnosis, tags, parsed };
};

/** Check one step's typed expression. check = {vars, expect(f), exact(bool), domain, mistakes:[{f,msg,tag}]} */
M.checkStepExpr = function (input, check) {
  const v = (check.vars || ['x'])[0];
  const parsed = M.parse(input, { vars: check.vars || ['x'] });
  if (!parsed.ok) return { ok: false, invalid: !parsed.code, msg: parsed.error, parsed };
  const F = M.fnOf(parsed.ast, v);
  const pts = M.points(check.domain || [0.3, 1.3], 8, 3);
  let ok;
  if (check.exact) ok = M.equalFns(F, check.expect, pts, 1e-6);
  else ok = M.equivConst(F, check.expect, pts).ok || (check.deriv ? M.derivMatches(F, check.deriv, pts) : false);
  if (ok) return { ok: true, parsed };
  for (const m of check.mistakes || []) {
    const hit = check.exact ? M.equalFns(F, m.f, pts, 1e-6) : M.equivConst(F, m.f, pts).ok;
    if (hit) return { ok: false, msg: m.msg, tag: m.tag, parsed };
  }
  if (check.exact && M.equalFns(F, (x) => -check.expect(x), pts, 1e-6)) return { ok: false, msg: 'Close — the sign is flipped.', tag: 'sign', parsed };
  if (!check.exact && M.equivConst(F, (x) => -check.expect(x), pts).ok) return { ok: false, msg: 'Close — the sign is flipped.', tag: 'sign', parsed };
  if (check.exact) {
    // constant factor?
    let k = null, good = true;
    for (const x of pts) { const a = F(x), b = check.expect(x); if (!fin(a) || !fin(b) || Math.abs(b) < 1e-9) continue; const r = a / b; if (k === null) k = r; else if (Math.abs(r - k) > 1e-6 * Math.max(1, Math.abs(k))) { good = false; break; } }
    if (good && k !== null && Math.abs(k - 1) > 1e-6) return { ok: false, msg: `Off by a factor of ${M.niceNumber(k)} — check the number in front.`, tag: 'kfactor', parsed };
  }
  return { ok: false, msg: null, parsed };
};

/** Check a number answer (exact or decimal). */
M.checkNumber = function (input, expected) {
  const parsed = M.parse(input, { vars: [] });
  if (!parsed.ok) return { ok: false, invalid: true, msg: parsed.error };
  const v = M.compile(parsed.ast)({});
  if (!fin(v)) return { ok: false, msg: 'That number is undefined.' };
  const tol = 1e-9 * Math.max(1, Math.abs(expected));
  if (Math.abs(v - expected) <= tol) return { ok: true, value: v, exactish: !/\d\.\d{3,}/.test(input) };
  if (Math.abs(v - expected) <= 5e-3 * Math.max(1, Math.abs(expected))) return { ok: true, approx: true, value: v };
  return { ok: false, value: v };
};

/* ---------------- TeX → speech ---------------- */
const SPEAK_FN = {
  '\\sin': 'sine', '\\cos': 'cosine', '\\tan': 'tangent', '\\sec': 'secant', '\\csc': 'cosecant', '\\cot': 'cotangent',
  '\\arcsin': 'arc sine', '\\arccos': 'arc cosine', '\\arctan': 'arc tangent', '\\ln': 'natural log', '\\log': 'log', '\\exp': 'e to the',
  '\\sinh': 'hyperbolic sine', '\\cosh': 'hyperbolic cosine',
};
const OPNAME = { arcsec: 'arc secant', arccsc: 'arc cosecant', arccot: 'arc cotangent', arcsinh: 'inverse hyperbolic sine' };
const ORD = { 2: 'squared', 3: 'cubed', 4: 'to the fourth', 5: 'to the fifth', 6: 'to the sixth', 7: 'to the seventh', 8: 'to the eighth' };
function texTokens(s) {
  const out = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (c === '\\') {
      const m = /^\\([a-zA-Z]+|.)/.exec(s.slice(i));
      if (/^\\text(bf|it)?$/.test(m[0]) && s[i + m[0].length] === '{') {
        // keep \text{...} as one token so its spaces survive ("divide first", not "d i v i d e")
        let depth = 1, j = i + m[0].length + 1;
        while (j < s.length && depth > 0) { if (s[j] === '{') depth++; else if (s[j] === '}') depth--; j++; }
        out.push('\\txt:' + s.slice(i + m[0].length + 1, j - 1)); i = j; continue;
      }
      out.push(m[0]); i += m[0].length; continue;
    }
    if (/\s/.test(c)) { i++; continue; }
    if (/[0-9]/.test(c)) { const m = /^[0-9]+(\.[0-9]+)?/.exec(s.slice(i)); out.push(m[0]); i += m[0].length; continue; }
    out.push(c); i++;
  }
  return out;
}
M.speak = function (tex) {
  const toks = texTokens(String(tex));
  const txt = sp(toks).replace(/\s+/g, ' ').replace(/\s+,/g, ',').replace(/,+/g, ',').replace(/^,\s*/, '').replace(/,\s*$/, '').trim();
  return txt;
};
function readGroup(toks, i) { // returns [tokens, newIndex]
  if (i >= toks.length) return [[], i];
  if (toks[i] === '{') {
    let depth = 1, j = i + 1;
    while (j < toks.length && depth > 0) { if (toks[j] === '{') depth++; else if (toks[j] === '}') depth--; j++; }
    return [toks.slice(i + 1, j - 1), j];
  }
  return [[toks[i]], i + 1];
}
function readDelim(toks, i, open) { // after \left<open>, read until matching \right
  let depth = 1, j = i;
  while (j < toks.length) {
    if (toks[j] === '\\left') depth++;
    else if (toks[j] === '\\right') { depth--; if (depth === 0) break; }
    j++;
  }
  return [toks.slice(i, j), Math.min(toks.length, j + 2)]; // skip \right and its delimiter
}
function readParen(toks, i) { // after '(' read until matching ')'
  let depth = 1, j = i;
  while (j < toks.length) { if (toks[j] === '(') depth++; else if (toks[j] === ')') { depth--; if (depth === 0) break; } j++; }
  return [toks.slice(i, j), j + 1];
}
function wc(s) { return s.trim().split(/\s+/).filter(Boolean).length; }
function powerWords(p) {
  const t = p.trim();
  if (ORD[t]) return ORD[t];
  if (t === '-1') return 'to the negative 1';
  return `to the ${t}${wc(t) > 2 ? ',' : ''}`;
}
function sp(toks) {
  const out = [];
  let i = 0;
  let prevAtom = false;
  const push = (w, atom) => { out.push(w); prevAtom = atom; };
  const times = () => { if (prevAtom) out.push('times'); };
  while (i < toks.length) {
    const t = toks[i++];
    if (t === '{') { const [g, j] = readGroup(toks, i - 1); i = j; const s = sp(g); if (s) push(s, true); continue; }
    if (t === '}' || t === '&' || t === '\\displaystyle' || t === '\\limits' || t === '\\nolimits') continue;
    if (t === '\\int') {
      let lo = null, hi = null;
      while (toks[i] === '_' || toks[i] === '^') { const k = toks[i]; const [g, j] = readGroup(toks, i + 1); i = j; if (k === '_') lo = sp(g); else hi = sp(g); }
      push(lo !== null ? `the integral from ${lo} to ${hi} of` : 'the integral of', false); continue;
    }
    if (t === '\\frac' || t === '\\tfrac' || t === '\\dfrac') {
      const [a, j] = readGroup(toks, i); const [b, k] = readGroup(toks, j); i = k;
      const A = sp(a), B = sp(b);
      times();
      push(wc(A) <= 2 && wc(B) <= 2 ? `${A} over ${B}` : `the fraction ${A}, over ${B},`, true); continue;
    }
    if (t === '\\sqrt') {
      let n = null;
      if (toks[i] === '[') { const k = toks.indexOf(']', i); n = toks.slice(i + 1, k).join(''); i = k + 1; }
      const [a, j] = readGroup(toks, i); i = j; const A = sp(a);
      times();
      if (n) push(`the ${n === '3' ? 'cube' : n + 'th'} root of ${A}${wc(A) > 2 ? ',' : ''}`, true);
      else push(wc(A) <= 2 ? `root ${A}` : `the square root of ${A},`, true);
      continue;
    }
    if (t === '\\lim') {
      let lo = '';
      if (toks[i] === '_') { const [g, j] = readGroup(toks, i + 1); i = j; lo = sp(g).replace(/ becomes /g, ' goes to '); }
      push(lo ? `the limit as ${lo} of` : 'the limit of', false); continue;
    }
    if (t === '\\htmlClass' || t === '\\color' || t === '\\textcolor' || t === '\\class') { const [, j] = readGroup(toks, i); i = j; continue; }
    if (t === '\\cancel' || t === '\\bcancel' || t === '\\xcancel') { const [a, j] = readGroup(toks, i); i = j; push(`cancel ${sp(a)},`, true); continue; }
    if (t === '\\boxed' || t === '\\mathrm' || t === '\\mathbf' || t === '\\boldsymbol' || t === '\\underline') continue;
    if (t === '\\underbrace' || t === '\\overbrace') {
      const [a, j] = readGroup(toks, i); i = j;
      if (toks[i] === '_' || toks[i] === '^') { const [, k] = readGroup(toks, i + 1); i = k; }
      const A = sp(a); if (A) push(A, true); continue;
    }
    if (t.startsWith('\\txt:')) { const w = t.slice(5).replace(/\\[a-zA-Z]+/g, ' ').replace(/[{}$\\]/g, ' ').replace(/\s+/g, ' ').trim(); if (w) push(w, false); continue; }
    if (t === '\\text' || t === '\\textbf' || t === '\\textit') { const [a, j] = readGroup(toks, i); i = j; push(a.join(' ').replace(/\\/g, ''), false); continue; }
    if (t === '\\operatorname') {
      const [a, j] = readGroup(toks, i); i = j; const name = a.join('');
      toks.splice(i, 0, '\\op:' + name); continue;
    }
    const fnWord = SPEAK_FN[t] || (t.startsWith('\\op:') ? (OPNAME[t.slice(4)] || t.slice(4)) : null);
    if (fnWord) {
      let p = null;
      if (toks[i] === '^') { const [g, j] = readGroup(toks, i + 1); i = j; p = sp(g); }
      let arg = '';
      if (toks[i] === '\\left') {
        const d = toks[i + 1]; const [g, j] = readDelim(toks, i + 2, d); i = j;
        arg = d === '|' ? `the absolute value of ${sp(g)},` : sp(g);
      } else if (toks[i] === '(') { const [g, j] = readParen(toks, i + 1); i = j; arg = sp(g); }
      else if (toks[i] === '{') { const [g, j] = readGroup(toks, i); i = j; arg = sp(g); }
      else {
        const run = [];
        while (i < toks.length && (/^[0-9.]+$/.test(toks[i]) || /^[a-zA-Z]$/.test(toks[i]) || toks[i] === '\\theta' || toks[i] === '\\pi')) {
          run.push(toks[i++]);
          if (toks[i] === '^') { run.push(toks[i++]); const [g, j] = readGroup(toks, i); run.push('{', ...g, '}'); i = j; }
        }
        arg = sp(run);
      }
      times();
      const pw = p ? (p.trim() === '-1' ? ' inverse' : ' ' + powerWords(p)) : '';
      push(`${fnWord}${pw} of ${arg}${wc(arg) > 2 ? ',' : ''}`, true); continue;
    }
    if (t === '\\left') {
      const d = toks[i]; const [g, j] = readDelim(toks, i + 1, d); i = j;
      const inner = sp(g);
      if (d === '[' && toks[i] === '_') {
        // [F(x)]_a^b: "F of x, evaluated from a to b"
        const [lo, j2] = readGroup(toks, i + 1); i = j2; let hi = null;
        if (toks[i] === '^') { const [h, j3] = readGroup(toks, i + 1); i = j3; hi = sp(h); }
        push(`${inner}, evaluated from ${sp(lo)}${hi != null ? ` to ${hi}` : ''},`, true); continue;
      }
      if (d === '|') { times(); push(`the absolute value of ${inner},`, true); }
      else { times(); push(prevAtom || out.length ? `the quantity ${inner},` : inner + ',', true); }
      continue;
    }
    if (t === '(') { const [g, j] = readParen(toks, i); i = j; const inner = sp(g); times(); push(wc(inner) > 2 ? `the quantity ${inner},` : inner, true); continue; }
    if (t === ')' || t === '\\right') continue;
    if (t === '^') {
      const [g, j] = readGroup(toks, i); i = j; const p = sp(g);
      if (p === 'plus') { push('from the right', true); continue; }
      if (p === 'negative' || p === 'minus') { push('from the left', true); continue; }
      push(powerWords(p), true); continue;
    }
    if (t === '_') { const [g, j] = readGroup(toks, i); i = j; push('sub ' + sp(g), true); continue; }
    if (t === '+') { push('plus', false); continue; }
    if (t === '-') { push(prevAtom ? 'minus' : 'negative', false); continue; }
    if (t === '=') { push('equals', false); continue; }
    if (t === '\\cdot' || t === '\\times') { push('times', false); continue; }
    if (t === '\\pm') { push('plus or minus', false); continue; }
    if (t === '\\to' || t === '\\rightarrow' || t === '\\longrightarrow') { push('becomes', false); continue; }
    if (t === '\\Rightarrow' || t === '\\implies') { push('so', false); continue; }
    if (t === '\\approx') { push('is about', false); continue; }
    if (t === ',' || t === ';' || t === '\\\\' || t === '\\qquad' || t === '\\quad') { push(',', false); continue; }
    if (t === '\\,' || t === '\\;' || t === '\\!' || t === '\\:' || t === '~' || t === '\\ ') {
      // "\, dx" → ", d x"
      if (toks[i] === 'd' && (toks[i + 1] === 'x' || toks[i + 1] === 'u' || toks[i + 1] === '\\theta' || toks[i + 1] === 't')) {
        const v = toks[i + 1] === '\\theta' ? 'theta' : toks[i + 1]; i += 2; push(`, d ${v}`, false);
      }
      continue;
    }
    if (t === '\\theta') { push('theta', true); continue; }
    if (t === '\\pi') { times(); push('pi', true); continue; }
    if (t === '\\infty') { push('infinity', true); continue; }
    if (t === '|') { push('absolute value', false); continue; }
    if (t === '/') { push('over', false); continue; }
    if (t === '<') { push('is less than', false); continue; }
    if (t === '>') { push('is greater than', false); continue; }
    if (t === '\\le' || t === '\\leq') { push('is at most', false); continue; }
    if (t === '\\ge' || t === '\\geq') { push('is at least', false); continue; }
    if (t === '\\ne' || t === '\\neq') { push('is not', false); continue; }
    if (t === '\\in') { push('is in', false); continue; }
    if (t === '\\cdots' || t === '\\ldots' || t === '\\dots') { push('and so on', true); continue; }
    if (t === '\\deg') { push('the degree of', false); continue; }
    if (/^[0-9.]+$/.test(t)) { push(t, true); continue; }
    if (/^[a-zA-Z]$/.test(t)) {
      if (t === 'd' && (toks[i] === 'x' || toks[i] === '\\theta' || toks[i] === 'u') && !prevAtom) { const v = toks[i] === '\\theta' ? 'theta' : toks[i]; i++; push(`d ${v}`, false); continue; }
      if (t === 'e' && toks[i] === '^') { times(); push('e', true); continue; }
      push(t === 'C' ? 'C' : t, true); continue;
    }
    if (t.startsWith('\\')) { const w = t.slice(1); if (/^[a-zA-Z]+$/.test(w)) push(w, true); continue; }
  }
  return out.join(' ');
}

})(typeof globalThis !== 'undefined' ? globalThis : this);
