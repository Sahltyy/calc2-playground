/* Builds the playground from src/.
     node build.js        -> dist/calc2-playground.html  (the Claude artifact; the Claude page wraps it)
     node build.js --web  -> docs/                       (the GitHub Pages site: add it to your home screen, works offline)
   Both builds run the same app. The web build carries everything it needs (KaTeX, fonts, icons) so it
   opens with no connection, and a service worker keeps a copy on the phone. */
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const ROOT = __dirname;
const WEB = process.argv.includes('--web');
const CLAUDE_URL = 'https://claude.ai/artifact/PQNCgA5L4GQ13fojDWcDoB'; // the Claude version (Ask Claude + account sync)
const rd = (p, enc = 'utf8') => fs.readFileSync(path.join(ROOT, p), enc);
const must = (s, what) => { if (!s.includes(what)) throw new Error('build: missing ' + what.slice(0, 60)); return s; };

/* KaTeX's stylesheet, with the fonts the app uses inlined (the rest are dropped) */
const kdir = 'node_modules/katex/dist';
let kcss = rd(kdir + '/katex.min.css');
const keep = new Set(['AMS-Regular', 'Main-Regular', 'Main-Bold', 'Main-Italic', 'Math-Italic', 'Size1-Regular', 'Size2-Regular', 'Size3-Regular', 'Size4-Regular']);
let kept = 0;
kcss = kcss.replace(/@font-face\{[^}]*\}/g, (rule) => {
  const m = /KaTeX_([A-Za-z0-9-]+)\.woff2/.exec(rule);
  if (!m) return rule;
  if (!keep.has(m[1])) return '';
  kept++;
  const b64 = rd(`${kdir}/fonts/KaTeX_${m[1]}.woff2`, null).toString('base64');
  return rule.replace(/src:[^;}]+/, `src:url(data:font/woff2;base64,${b64}) format("woff2")`);
});

const order = ['engine', 'gen_common', 'gen_ibp', 'gen_trig', 'gen_tsub', 'gen_pf', 'gen_imp', 'lessons', 'guide', 'ui_core', 'ui_visuals', 'ui_app', 'ui_tools', 'ui_guide'];
const js = order.map((n) => `/* ---- ${n}.js ---- */\n` + rd(`src/${n}.js`)).join('\n');
if (/<\/script/i.test(js)) throw new Error('</script> inside JS');
const css = rd('src/styles.css');
const shell = rd('src/shell.html');

if (!WEB) {
  const html = shell.replace('/*APP_CSS*/', () => css).replace('/*KATEX_CSS*/', () => kcss).replace('/*APP_JS*/', () => js);
  fs.mkdirSync(path.join(ROOT, 'dist'), { recursive: true });
  fs.writeFileSync(path.join(ROOT, 'dist/calc2-playground.html'), html);
  console.log('artifact: fonts kept', kept, 'size', (html.length / 1024).toFixed(0) + 'KB', 'title in first 8KB:', html.slice(0, 8192).includes('<title>'));
} else {
  buildWeb();
}

function buildWeb() {
  const OUT = path.join(ROOT, 'docs');
  fs.rmSync(OUT, { recursive: true, force: true });
  fs.mkdirSync(path.join(OUT, 'fonts'), { recursive: true });
  fs.mkdirSync(path.join(OUT, 'icons'), { recursive: true });

  /* the app's three fonts, served from ./fonts (Latin + Latin Extended), so they work offline */
  const FONTS = [['lexend', [400, 500, 600, 700]], ['caveat', [600, 700]], ['jetbrains-mono', [400, 600]]];
  let fontCss = '';
  const assets = [];
  for (const [pkg, weights] of FONTS) for (const w of weights) {
    for (const rule of rd(`node_modules/@fontsource/${pkg}/${w}.css`).match(/@font-face\s*\{[^}]*\}/g) || []) {
      const file = (/url\(\.\/files\/([^)]+\.woff2)\)/.exec(rule) || [])[1];
      if (!file || !/-latin-(ext-)?\d+-normal\.woff2$/.test(file)) continue;
      fs.copyFileSync(path.join(ROOT, `node_modules/@fontsource/${pkg}/files/${file}`), path.join(OUT, 'fonts', file));
      assets.push('fonts/' + file);
      fontCss += rule.replace(/src:[^;]+;/, `src: url(fonts/${file}) format('woff2');`) + '\n';
    }
  }
  if (assets.length < 16) throw new Error('build: fonts missing (' + assets.length + ')');

  /* icons (made once by tools/make_icons.py) */
  for (const f of fs.readdirSync(path.join(ROOT, 'assets/icons'))) {
    fs.copyFileSync(path.join(ROOT, 'assets/icons', f), path.join(OUT, 'icons', f));
    assets.push('icons/' + f);
  }

  /* the page: same app, KaTeX inline, local fonts, and a full HTML document around it */
  const katexJs = rd(kdir + '/katex.min.js');
  if (/<\/script/i.test(katexJs)) throw new Error('</script> inside KaTeX');
  let page = shell;
  page = must(page, '<link rel="stylesheet" href="https://fonts.googleapis.com').replace(/<link rel="preconnect"[^>]*>\n?/g, '').replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com[^>]*>\n?/, '');
  page = must(page, 'katex.min.js"></script>').replace(/<script src="https:\/\/cdnjs\.cloudflare\.com\/ajax\/libs\/KaTeX\/[^"]+\/katex\.min\.js"><\/script>/, () => `<script>${katexJs}</script>`);
  page = page.replace('/*APP_CSS*/', () => fontCss + css).replace('/*KATEX_CSS*/', () => kcss)
    .replace('/*APP_JS*/', () => `window.CALC2_WEB = { claudeUrl: ${JSON.stringify(CLAUDE_URL)} };\n` + js);
  const cut = must(page, '<div id="app">').indexOf('<div id="app">');
  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#fbfaff" media="(prefers-color-scheme: light)">
<meta name="theme-color" content="#121019" media="(prefers-color-scheme: dark)">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-title" content="Calc 2">
<meta name="apple-mobile-web-app-status-bar-style" content="default">
<link rel="manifest" href="manifest.webmanifest">
<link rel="icon" href="icons/icon-192.png" type="image/png">
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png">
<style>body{margin:0}[hidden]{display:none!important}</style>
${page.slice(0, cut).trim()}
</head>
<body>
${page.slice(cut).trim()}
<script>
/* keep a copy on this device so it opens with no connection */
if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
  window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
}
</script>
</body>
</html>
`;
  fs.writeFileSync(path.join(OUT, 'index.html'), html);

  fs.writeFileSync(path.join(OUT, 'manifest.webmanifest'), JSON.stringify({
    name: 'Calc 2 Playground',
    short_name: 'Calc 2',
    description: 'Calc 2 practice for 7.1 to 7.4 and 7.8, with a step-list study guide.',
    start_url: './',
    scope: './',
    display: 'standalone',
    background_color: '#fbfaff',
    theme_color: '#fbfaff',
    icons: [
      { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: 'icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }, null, 2) + '\n');
  assets.push('manifest.webmanifest');

  /* service worker: the cache name changes whenever anything in the build changes, so a new build replaces the old copy */
  const h = crypto.createHash('sha256');
  h.update(html); for (const a of assets) h.update(a).update(fs.readFileSync(path.join(OUT, a)));
  const version = h.digest('hex').slice(0, 12);
  fs.writeFileSync(path.join(OUT, 'sw.js'), rd('src/sw.js').replace('__VERSION__', version).replace('/*__ASSETS__*/', () => assets.map((a) => JSON.stringify('./' + a)).join(', ')));
  fs.writeFileSync(path.join(OUT, '.nojekyll'), '');
  const kb = (n) => (n / 1024).toFixed(0) + 'KB';
  const total = ['index.html', 'sw.js', ...assets].reduce((s, a) => s + fs.statSync(path.join(OUT, a)).size, 0);
  console.log(`web: docs/ version ${version}, index.html ${kb(html.length)}, ${assets.length} assets, ${kb(total)} total`);
}
