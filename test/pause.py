import os
from playwright.sync_api import sync_playwright
SHOTS = os.environ.get('SHOTS', os.path.abspath('test/shots'))
os.makedirs(SHOTS, exist_ok=True)
katex = open('node_modules/katex/dist/katex.min.js').read()
body = open('dist/calc2-playground.html').read()
open('dist/test.html','w').write('<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}[hidden]{display:none!important}</style></head><body>' + body + '</body></html>')
errors = []; fails = []
def check(cond, msg):
    print(('PASS ' if cond else 'FAIL ') + msg, flush=True)
    if not cond: fails.append(msg)
def setup(page):
    page.on('console', lambda m: errors.append(('console', m.text)) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(('pageerror', str(e))))
    page.route('**/katex.min.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body=katex))
    page.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=''))
    page.route('https://fonts.gstatic.com/**', lambda r: r.abort())
URL = ('file://' + os.path.abspath('dist/test.html'))
TM = "UI.Sprint.state"
def tm(page, k): return page.evaluate(f"() => {TM}.{k}")
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 1280, 'height': 900})
    page = ctx.new_page(); setup(page)
    page.goto(URL); page.wait_for_timeout(300)
    page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }"); page.reload(); page.wait_for_timeout(400)
    page.evaluate("() => { UI.Store.state.settings.sound = false; UI.Store.state.units.ibp.lessonDone = true; UI.go({name:'unit', unit:'ibp', tab:'practice'}); }"); page.wait_for_timeout(300)

    # ---------- quiz set, focus bar ----------
    check(page.query_selector('.focusbar #fbSprintBtn') is not None, 'quiz set shows the timer chip in the focus bar')
    check('15-min sprint' in page.inner_text('#fbSprintBtn') and page.is_hidden('#timerChip'), 'idle: chip offers a sprint, top-bar timer hidden')
    page.click('#fbSprintBtn'); page.wait_for_timeout(700)
    check(tm(page, 'running') and 'min' in page.inner_text('#fbSprint'), 'tap 1 starts the sprint')
    check('live' in page.get_attribute('#fbSprintBtn', 'class') and 'Tap to pause' in page.get_attribute('#fbSprintBtn', 'aria-label'), 'running chip says it pauses')
    check(page.is_visible('#timerChip') and page.get_attribute('#timerPP', 'aria-label') == 'Pause the timer', 'top bar shows [pause | time]')
    page.screenshot(path=f'{SHOTS}/50-sprint-running.png', full_page=False)

    page.click('#fbSprintBtn'); page.wait_for_timeout(300)
    left = tm(page, 'left')
    check(page.evaluate("() => UI.Sprint.paused()") and not tm(page, 'running'), 'tap 2 pauses (one tap, no drawer)')
    check(page.query_selector('.drawer[aria-hidden="false"]') is None, 'pausing does not open the timer drawer')
    check('Paused' in page.inner_text('#fbSprint') and 'paused' in page.get_attribute('#fbSprintBtn', 'class'), 'chip says Paused and lights up')
    check('Tap to resume' in page.get_attribute('#fbSprintBtn', 'aria-label'), 'paused chip label says resume')
    check('paused' in page.get_attribute('#ribbon', 'class') and not page.is_hidden('#ribbon'), 'time bar stays, dashed as paused')
    check('paused' in page.get_attribute('#timerChip', 'class') and page.get_attribute('#timerPP', 'aria-label') == 'Resume the timer', 'top-bar button flips to resume')
    toasts = page.inner_text('.toast-wrap') if page.query_selector('.toast-wrap') else ''
    check('paused' in toasts.lower(), f'a short "paused" toast ({toasts.strip()[:60]})')
    check(len(page.query_selector_all('.toast-wrap [data-key="timer"]')) == 1 and 'started' not in toasts, 'the paused message replaces the started one (no pile-up)')
    page.screenshot(path=f'{SHOTS}/51-sprint-paused.png', full_page=False)
    page.wait_for_timeout(1600)
    check(tm(page, 'left') == left, f'paused time does not move ({left} -> {tm(page, "left")})')

    page.click('#fbSprintBtn'); page.wait_for_timeout(300)
    check(tm(page, 'running') and abs(tm(page, 'left') - left) <= 1, 'tap 3 resumes from the same spot')
    check(page.query_selector('.toast-wrap [data-key="timer"]') is None, 'resuming clears the stale "paused" message')
    check(page.get_attribute('#timerPP', 'aria-label') == 'Pause the timer', 'top bar back to pause')

    # exact time is kept when pausing
    page.evaluate(f"() => {{ {TM}.end = Date.now() + 125400; }}"); page.wait_for_timeout(50)
    page.click('#timerPP'); page.wait_for_timeout(200)
    check(page.evaluate("() => UI.Sprint.paused()") and tm(page, 'left') in (125, 124), f'top-bar pause button works, keeps the exact time ({tm(page, "left")}s)')
    check('3 min' in page.inner_text('#fbSprint'), 'focus-bar chip follows the top-bar button')
    page.click('#timerPP'); page.wait_for_timeout(200)
    check(tm(page, 'running'), 'top-bar button resumes')

    # the time itself still opens the settings drawer
    page.click('.tchip-t'); page.wait_for_timeout(400)
    check(page.inner_text('#drawerTitle') == 'Focus timer' and 'Pause' in page.inner_text('#tmGo'), 'tapping the time opens timer settings')
    check('press P' in page.inner_text('#drawerBody'), 'drawer explains how to pause')
    page.click('#tmGo'); page.wait_for_timeout(200)
    check(page.evaluate("() => UI.Sprint.paused()") and 'Resume' in page.inner_text('#tmGo'), 'drawer pause still works, says Resume')
    page.click('[data-close-tool]'); page.wait_for_timeout(250)
    check('Paused' in page.inner_text('#fbSprint'), 'state is shared everywhere')

    # keyboard: P toggles, but typing p in the answer box just types
    page.evaluate("() => document.activeElement && document.activeElement.blur()")
    page.keyboard.press('p'); page.wait_for_timeout(200)
    check(tm(page, 'running'), 'P resumes')
    page.keyboard.press('p'); page.wait_for_timeout(200)
    check(page.evaluate("() => UI.Sprint.paused()"), 'P pauses')
    page.click('#mfS-in'); page.keyboard.type('p'); page.wait_for_timeout(200)
    check(page.evaluate("() => UI.Sprint.paused()") and page.input_value('#mfS-in').endswith('p'), 'typing p in the answer does not touch the timer')
    page.fill('#mfS-in', ''); page.wait_for_timeout(100)

    # paused stays paused across re-renders (moving between problems)
    page.click('#setNext'); page.wait_for_timeout(250)
    check('Paused' in page.inner_text('#fbSprint') and 'paused' in page.get_attribute('#fbSprintBtn', 'class'), 'still paused on the next problem')

    # pausing right after starting is still "paused", not "never started"
    page.evaluate("() => UI.Sprint.reset()"); page.wait_for_timeout(100)
    check('15-min sprint' in page.inner_text('#fbSprint') and page.is_hidden('#timerChip') and page.is_hidden('#ribbon'), 'reset goes back to idle')
    page.click('#fbSprintBtn'); page.click('#fbSprintBtn'); page.wait_for_timeout(250)
    check(page.evaluate("() => UI.Sprint.paused()") and page.is_visible('#timerChip') and 'Paused' in page.inner_text('#fbSprint'), 'instant pause still shows as paused')
    page.click('#fbSprintBtn'); page.wait_for_timeout(200)

    # breaks pause too, and a finished break goes back to idle
    page.evaluate("() => UI.Sprint.start(2, 'break')"); page.wait_for_timeout(200)
    check('break' in page.inner_text('#fbSprint'), 'break shows on the chip')
    page.click('#fbSprintBtn'); page.wait_for_timeout(200)
    check(page.evaluate("() => UI.Sprint.paused()") and tm(page, 'mode') == 'break', 'a break can be paused')
    page.click('#fbSprintBtn'); page.wait_for_timeout(100)
    page.evaluate(f"() => {{ {TM}.end = Date.now() + 400; }}"); page.wait_for_timeout(1300)
    check(page.evaluate("() => UI.Sprint.idle()") and '15-min sprint' in page.inner_text('#fbSprint'), 'break ends: back to a fresh sprint chip')

    # sprint end still rolls into a break by itself
    page.click('#fbSprintBtn'); page.wait_for_timeout(200)
    page.evaluate(f"() => {{ {TM}.end = Date.now() + 500; }}"); page.wait_for_timeout(1400)
    check(tm(page, 'mode') == 'break' and tm(page, 'running'), 'sprint end still starts the break')
    page.evaluate("() => UI.Sprint.reset()")

    # boss quiz has the same chip
    page.evaluate("() => { UI.Store.state.units.ibp.mastery = 100; UI.app.Q = null; UI.go({name:'unit', unit:'ibp', tab:'quiz'}); }"); page.wait_for_timeout(200)
    page.click('[data-act="startQuiz"]'); page.wait_for_timeout(300)
    page.click('#fbSprintBtn'); page.wait_for_timeout(200); page.click('#fbSprintBtn'); page.wait_for_timeout(200)
    check(page.evaluate("() => UI.Sprint.paused()") and 'Paused' in page.inner_text('#fbSprint'), 'Boss Quiz: one-tap pause too')
    page.evaluate("() => UI.Sprint.reset()")

    # ---------- quiz-set time: counts while you work, not while you're gone ----------
    page.evaluate("() => { UI.Store.state.units.ibp.mastery = 20; delete UI.app.SET.ibp; delete UI.Store.state.sets.ibp; UI.go({name:'unit', unit:'ibp', tab:'practice'}); }"); page.wait_for_timeout(300)
    a0 = page.evaluate("() => UI.app.SET.ibp.act")
    page.mouse.move(300, 300); page.wait_for_timeout(2300)
    a1 = page.evaluate("() => UI.app.SET.ibp.act")
    check(a1 - a0 >= 2000, f'time on the set counts while it is on screen (+{a1 - a0} ms)')
    page.evaluate("() => UI.go({name:'home'})"); page.wait_for_timeout(2200)
    check(page.evaluate("() => UI.app.SET.ibp.act") == a1 or page.evaluate("() => UI.app.SET.ibp.act") - a1 <= 1000, 'time stops when you leave the set')
    page.evaluate("() => { UI.app.SET.ibp.act = 7 * 60000; UI.app.SET.ibp.items.forEach((it) => it.ans = 'x'); UI.go({name:'unit', unit:'ibp', tab:'practice'}); }"); page.wait_for_timeout(250)
    page.click('[data-act="setReview"] >> nth=-1'); page.wait_for_timeout(200)
    page.click('[data-act="setGrade"]'); page.wait_for_timeout(1800)
    check('7 min' in page.inner_text('.result') and '7 minutes of focus' in page.inner_text('.break-tip'), 'report uses real working time')
    # a set saved by the old version (no active time) resumed days later is capped
    page.evaluate("""() => { const s = UI.Store.state; delete UI.app.SET.ibp;
      const S = { i: 0, t0: Date.now() - 3 * 86400000, kind: 'set', stage: 'work', items: [] };
      const p = M.generate('ibp', 1, M.rng(42)); S.items.push({ seed: 42, level: 1, family: null, tex: p.tex, ans: '', hints: 0 });
      s.sets.ibp = S; UI.go({name:'unit', unit:'ibp', tab:'practice'}); }"""); page.wait_for_timeout(300)
    act = page.evaluate("() => UI.app.SET.ibp.act")
    check(600000 <= act <= 603000, f'old saved set: an overnight gap does not count as focus ({act} ms)')
    page.wait_for_timeout(700)
    check(page.evaluate("() => typeof UI.Store.state.sets.ibp.act") in ('number', 'undefined'), 'saved set carries its time')
    ctx.close()

    # ---------- Test Simulator ----------
    ctx = b.new_context(viewport={'width': 1280, 'height': 900})
    page = ctx.new_page(); setup(page)
    page.goto(URL); page.wait_for_timeout(300)
    page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }"); page.reload(); page.wait_for_timeout(400)
    page.evaluate("() => { UI.Store.state.settings.sound = false; UI.Store.state.settings.unlockAll = true; UI.go({name:'test'}); }"); page.wait_for_timeout(300)
    check('pause' in page.inner_text('.switch').lower(), 'intro says the timer can be paused')
    check('12 questions' in page.inner_text('.quiz') and '30-minute' in page.inner_text('.switch'), 'intro: 12 questions, 30 minutes')
    page.click('[data-act="tsStart"]'); page.wait_for_timeout(700)
    mix = page.evaluate("() => { const c = {}; UI.app.TS.qs.forEach((q) => { c[q.unit] = (c[q.unit] || 0) + 1; }); return c; }")
    check(len(page.evaluate("() => UI.app.TS.qs")) == 12 and mix.get('imp', 0) == 3 and mix.get('pf', 0) == 3 and all(mix.get(k, 0) == 2 for k in ['ibp', 'trig', 'tsub']), f'12-question mix covers all five sections ({mix})')
    check(page.query_selector('.ts-clock #tsTime') is not None and (page.inner_text('#tsTime').startswith('29:') or page.inner_text('#tsTime') == '30:00'), f'test clock is a button ({page.inner_text("#tsTime")})')
    page.click('.opts .opt >> nth=1'); page.wait_for_timeout(150)
    page.click('[data-act="tsNav"][data-d="1"]'); page.wait_for_timeout(150)
    page.evaluate("() => { UI.app.TS.end = Date.now() + (18 * 60 + 42) * 1000 + 500; }"); page.wait_for_timeout(600)
    page.click('.ts-clock'); page.wait_for_timeout(300)
    TSq = "UI.app.TS"
    check(page.evaluate(f"() => {TSq}.paused"), 'tap the clock: test paused')
    check(page.query_selector('.paused-card') is not None and page.query_selector('.opts') is None and page.query_selector('.numnav') is None, 'paused screen hides the questions')
    txt = page.inner_text('.paused-card')
    check('18:4' in txt and '1 of 12 answered' in txt, f'paused screen shows the stopped time and progress ({" ".join(txt.split())[:90]})')
    clock = page.inner_text('#tsTime'); page.wait_for_timeout(1600)
    check(page.inner_text('#tsTime') == clock and page.evaluate(f"() => {TSq}.stage") == 'q', f'clock frozen while paused ({clock})')
    page.screenshot(path=f'{SHOTS}/52-test-paused.png', full_page=False)
    page.click('.paused-card [data-act="tsPause"]'); page.wait_for_timeout(700)
    check(not page.evaluate(f"() => {TSq}.paused") and page.query_selector('.opts') is not None, 'Resume brings the question back')
    check(page.evaluate(f"() => {TSq}.i") == 1 and page.evaluate(f"() => {TSq}.qs[0].pick") == 1, 'same question, answers kept')
    lm = page.evaluate(f"() => {TSq}.end - Date.now()")
    check(abs(lm - (18 * 60 + 42) * 1000) < 2500, f'clock picks up where it stopped ({lm} ms left)')

    # keyboard P
    page.keyboard.press('p'); page.wait_for_timeout(200)
    check(page.evaluate(f"() => {TSq}.paused") and page.query_selector('.paused-card') is not None, 'P pauses the test')
    page.keyboard.press('p'); page.wait_for_timeout(200)
    check(not page.evaluate(f"() => {TSq}.paused"), 'P resumes the test')

    # a running focus sprint pauses with the test and comes back with it
    page.evaluate("() => UI.Sprint.start(15)"); page.wait_for_timeout(200)
    page.click('.ts-clock'); page.wait_for_timeout(200)
    check(page.evaluate("() => UI.Sprint.paused()"), 'pausing the test also pauses a running sprint')
    page.click('.ts-clock'); page.wait_for_timeout(200)
    check(page.evaluate("() => UI.Sprint.state.running"), 'and resuming the test resumes it')
    # but a sprint you paused yourself stays paused
    page.click('#timerPP'); page.wait_for_timeout(150)
    page.click('.ts-clock'); page.wait_for_timeout(150); page.click('.ts-clock'); page.wait_for_timeout(150)
    check(page.evaluate("() => UI.Sprint.paused()"), 'a sprint you paused yourself stays paused')
    # with both running, P goes to the test clock (it's the one on screen)
    page.click('#timerPP'); page.wait_for_timeout(150)
    page.keyboard.press('p'); page.wait_for_timeout(200)
    check(page.evaluate(f"() => {TSq}.paused"), 'P on the test page pauses the test clock')
    page.keyboard.press('p'); page.wait_for_timeout(200)
    page.evaluate("() => UI.Sprint.reset()")

    # leaving while paused and coming back: still paused, still frozen
    page.click('.ts-clock'); page.wait_for_timeout(200)
    frozen = page.evaluate(f"() => {TSq}.left")
    page.evaluate("() => UI.go({name:'home'})"); page.wait_for_timeout(1200)
    page.evaluate("() => UI.go({name:'test'})"); page.wait_for_timeout(300)
    check(page.query_selector('.paused-card') is not None and page.evaluate(f"() => {TSq}.left") == frozen, 'paused test survives leaving the page')
    page.click('.paused-card [data-act="tsPause"]'); page.wait_for_timeout(200)

    # time running out after a pause still turns it in
    page.evaluate(f"() => {{ {TSq}.end = Date.now() + 600; }}"); page.wait_for_timeout(1500)
    check(page.evaluate(f"() => {TSq}.stage") == 'done' and page.query_selector('.grade-big') is not None, 'time up after a pause still grades the test')

    # untimed test: no clock, no pause key effect
    page.evaluate("() => { UI.app.TS = null; UI.go({name:'test'}); }"); page.wait_for_timeout(200)
    page.uncheck('#tsTimer'); page.click('[data-act="tsStart"]'); page.wait_for_timeout(300)
    page.keyboard.press('p'); page.wait_for_timeout(150)
    check(page.query_selector('.ts-clock') is None and not page.evaluate(f"() => {TSq}.paused"), 'untimed test: no clock to pause')
    ctx.close()

    # ---------- phone ----------
    ctx = b.new_context(viewport={'width': 360, 'height': 780}, color_scheme='dark', has_touch=True, is_mobile=True, device_scale_factor=2)
    page = ctx.new_page(); setup(page)
    page.goto(URL); page.wait_for_timeout(300)
    page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }"); page.reload(); page.wait_for_timeout(400)
    page.evaluate("() => { UI.Store.state.settings.sound = false; UI.Store.state.xp = 12450; UI.Store.state.units.ibp.lessonDone = true; UI.render(); UI.go({name:'unit', unit:'ibp', tab:'practice'}); }"); page.wait_for_timeout(300)
    page.tap('#fbSprintBtn'); page.wait_for_timeout(300)
    page.screenshot(path=f'{SHOTS}/53-phone-running.png', full_page=False)
    page.tap('#fbSprintBtn'); page.wait_for_timeout(300)
    check(page.evaluate("() => UI.Sprint.paused()"), 'phone: tap pauses')
    sw = page.evaluate("() => document.documentElement.scrollWidth")
    check(sw <= 360, f'phone: paused chip fits, no sideways scroll ({sw})')
    over = page.evaluate("""() => { const bar = document.querySelector('.topbar').getBoundingClientRect(); return [...document.querySelectorAll('.topbar > *:not(.ribbon)')].filter((e) => !e.hidden).map((e) => e.getBoundingClientRect()).some((r) => r.right > bar.right + 0.5 || r.left < bar.left - 0.5); }""")
    check(not over, 'phone: top bar fits with the [pause | time] chip')
    pp = page.evaluate("() => { const r = document.getElementById('timerPP').getBoundingClientRect(); return [r.width, r.height]; }")
    check(pp[0] >= 34 and pp[1] >= 30, f'phone: pause button is a real tap target {pp}')
    fb = page.evaluate("() => { const r = document.getElementById('fbSprintBtn').getBoundingClientRect(); return r.right <= window.innerWidth; }")
    check(fb, 'phone: focus-bar chip on screen')
    page.screenshot(path=f'{SHOTS}/54-phone-paused.png', full_page=False)
    page.tap('#timerPP'); page.wait_for_timeout(200)
    check(page.evaluate("() => UI.Sprint.state.running"), 'phone: top-bar tap resumes')
    page.evaluate("() => { UI.Sprint.reset(); UI.Store.state.settings.unlockAll = true; UI.go({name:'test'}); }"); page.wait_for_timeout(200)
    page.tap('[data-act="tsStart"]'); page.wait_for_timeout(300); page.tap('.ts-clock'); page.wait_for_timeout(300)
    page.screenshot(path=f'{SHOTS}/55-phone-test-paused.png', full_page=False)
    check(page.evaluate("() => document.documentElement.scrollWidth") <= 360, 'phone: paused test screen fits')
    ctx.close(); b.close()
print('ERRORS', len(errors)); [print(e) for e in errors[:20]]
print('FAILS', len(fails)); [print(' -', f) for f in fails]
