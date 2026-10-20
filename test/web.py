# The GitHub Pages build (docs/): loads from a web server, installs its offline copy,
# then opens again with the network switched off.
import os, subprocess, time, json, socket
from playwright.sync_api import sync_playwright
SHOTS = os.environ.get('SHOTS', os.path.abspath('test/shots'))
os.makedirs(SHOTS, exist_ok=True)
fails, errors = [], []
def check(c, m):
    print(('PASS ' if c else 'FAIL ') + m, flush=True)
    if not c: fails.append(m)
s = socket.socket(); s.bind(('127.0.0.1', 0)); PORT = s.getsockname()[1]; s.close()
srv = subprocess.Popen(['python3', '-m', 'http.server', str(PORT), '--bind', '127.0.0.1', '--directory', 'docs'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(0.8)
URL = f'http://127.0.0.1:{PORT}/'
external = []
try:
    with sync_playwright() as p:
        b = p.chromium.launch()
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, is_mobile=True, has_touch=True, device_scale_factor=2)
        page = ctx.new_page()
        page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
        page.on('pageerror', lambda e: errors.append(str(e)))
        page.on('request', lambda r: external.append(r.url) if not r.url.startswith(URL) and not r.url.startswith('data:') else None)
        page.goto(URL); page.wait_for_timeout(1200)
        check(page.evaluate("() => !!window.katex && !!document.querySelector('.topbar')"), 'app boots with KaTeX inline')
        check(page.title() == 'Calc 2 Playground', 'title')
        m = page.evaluate("() => fetch('manifest.webmanifest').then((r) => r.json())")
        check(m['short_name'] == 'Calc 2' and len(m['icons']) == 3, 'manifest')
        ready = page.evaluate("() => navigator.serviceWorker.ready.then((r) => !!r.active)")
        check(ready, 'service worker active')
        page.wait_for_timeout(800)
        cached = page.evaluate("() => caches.keys().then((ks) => Promise.all(ks.map((k) => caches.open(k).then((c) => c.keys())))).then((all) => all.flat().map((r) => r.url))")
        check(any(u.endswith('/index.html') for u in cached) and sum('/fonts/' in u for u in cached) >= 16, f'offline copy saved ({len(cached)} files)')
        fl = page.evaluate("() => Promise.all(['600 16px Lexend', '700 24px Caveat', '400 16px \"JetBrains Mono\"'].map((f) => document.fonts.load(f))).then((r) => r.map((x) => x.length))")
        check(all(n > 0 for n in fl), f'fonts load from this site ({fl})')
        check(not external, f'no outside requests ({external[:3]})')
        # a few real screens online
        page.click('.nu-more [data-act="guide"]'); page.wait_for_timeout(400)
        check(page.query_selector('.g-tiles') is not None, 'study guide opens')

        # ---- offline ----
        ctx.set_offline(True)
        page.reload(); page.wait_for_timeout(1500)
        check(page.evaluate("() => !!document.querySelector('.topbar') && !!window.UI"), 'opens with no connection')
        page.evaluate("() => UI.go({ name: 'guide', unit: 'imp', sc: 'upper_inf' })"); page.wait_for_timeout(400)
        check(page.query_selector('.g-stepcard .katex') is not None, 'math renders offline')
        page.click('[data-act="gTry"]'); page.wait_for_timeout(500)
        check(page.query_selector('.problem-card .katex') is not None, 'practice works offline')
        page.click('.dock-btn[data-tool="ask"]'); page.wait_for_timeout(400)
        check(page.query_selector('#askCopy') is not None, 'Ask shows the copy-for-Claude button')
        check(page.query_selector('#drawer a[href*="claude.ai/artifact"]') is not None, 'link to the Claude version')
        ctx.grant_permissions(['clipboard-read', 'clipboard-write'], origin=URL[:-1])
        page.click('#askCopy'); page.wait_for_timeout(400)
        txt = page.evaluate("() => navigator.clipboard.readText().catch(() => '')")
        check('Calc 2' in txt and '\\int' in txt, f'copied problem text ({txt[:70]!r})')
        page.screenshot(path=f'{SHOTS}/w01-offline-ask.png')
        page.click('[data-close-tool]'); page.wait_for_timeout(200)
        page.screenshot(path=f'{SHOTS}/w02-offline-practice.png')
        # progress saved offline survives a reload
        page.evaluate("() => { UI.Store.state.xp = 321; UI.Store.save(); }"); page.reload(); page.wait_for_timeout(1200)
        check(page.evaluate("() => UI.Store.state.xp") == 321, 'progress kept on this device')
        ow = page.evaluate("() => document.documentElement.scrollWidth - innerWidth")
        check(ow <= 0, 'no sideways scroll on a phone')
        ctx.set_offline(False)
        print('errors', errors)
        check(not [e for e in errors if 'ERR_INTERNET_DISCONNECTED' not in e], 'no console errors')
        b.close()
finally:
    srv.terminate()
print('FAILS', len(fails))
for f in fails: print(' -', f)
