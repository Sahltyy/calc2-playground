import os
# 7.8 in the browser: unlocking after 7.4, instant check with "diverges", the Diverges key,
# a quiz set, the boss quiz, and the five-section finish.
from playwright.sync_api import sync_playwright
SHOTS = os.environ.get('SHOTS', os.path.abspath('test/shots'))
os.makedirs(SHOTS, exist_ok=True)
body = open('dist/calc2-playground.html').read()
open('dist/test.html', 'w').write('<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light}body{margin:0;font:14px system-ui}[hidden]{display:none!important}</style></head><body>' + body + '</body></html>')
katex = open('node_modules/katex/dist/katex.min.js').read()
errors, fails = [], []
def check(c, m):
    print(('PASS ' if c else 'FAIL ') + m, flush=True)
    if not c: fails.append(m)
DISMISS = "() => document.querySelectorAll('.modal, .modal-scrim').forEach((e) => e.remove())"
ASCII = r"""(t) => { let s = t; for (let k = 0; k < 4; k++) s = s.replace(/\\frac\{([^{}]*)\}\{([^{}]*)\}/g, '(($1)/($2))').replace(/\\sqrt\{([^{}]*)\}/g, 'sqrt($1)').replace(/e\^\{([^{}]*)\}/g, 'e^($1)'); return s.replace(/\\pi/g, 'pi').replace(/\\ln/g, 'ln').replace(/\\left|\\right/g, '').replace(/\\,/g, '').replace(/\{|\}/g, ''); }"""
with sync_playwright() as p:
    b = p.chromium.launch()
    page = b.new_page(viewport={'width': 1280, 'height': 900})
    page.on('console', lambda m: errors.append(m.text) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(str(e)))
    page.route('**/katex.min.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body=katex))
    page.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=''))
    page.route('https://fonts.gstatic.com/**', lambda r: r.abort())
    page.goto(('file://' + os.path.abspath('dist/test.html'))); page.wait_for_timeout(600)
    page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }"); page.reload(); page.wait_for_timeout(600)
    page.evaluate("() => { UI.Store.state.settings.sound = false; }")

    # ---- 7.8 is the 5th station, locked behind the 7.4 boss quiz
    check(len(page.query_selector_all('.path .station-card[data-act="openUnit"]')) == 5, 'five stations on the map')
    check(page.evaluate("() => UI.isLocked('imp')"), '7.8 starts locked')
    page.evaluate("() => { const u = UI.Store.state.units; ['ibp','trig','tsub'].forEach((k) => { u[k].quizPassed = true; u[k].mastery = 100; u[k].lessonDone = true; }); u.pf.mastery = 100; u.pf.lessonDone = true; UI.Store.save(); UI.go({ name: 'unit', unit: 'pf', tab: 'quiz' }); }"); page.wait_for_timeout(300)
    page.click('[data-act="startQuiz"]'); page.wait_for_timeout(200)
    for i in range(8):
        k = page.evaluate("() => UI.app.Q.qs[UI.app.Q.i].opts.findIndex((o) => o.correct)")
        page.click(f'[data-act="qpick"][data-k="{k}"]'); page.wait_for_timeout(60)
        if i < 7: page.click('[data-act="qnav"][data-d="1"]'); page.wait_for_timeout(60)
    page.click('[data-act="qfinish"]'); page.wait_for_timeout(900)
    txt = page.inner_text('body')
    check('Improper Integrals' in txt and 'unlocked' in txt, 'passing 7.4 unlocks 7.8 (celebration)')
    check(not page.evaluate("() => UI.isLocked('imp')"), '7.8 unlocked')
    page.screenshot(path=f'{SHOTS}/i01-unlock.png', full_page=False)
    nx = page.query_selector('.modal [data-act]')
    page.evaluate("() => { document.querySelectorAll('.modal, .modal-scrim').forEach((e) => e.remove()); UI.go({ name: 'home' }); }"); page.wait_for_timeout(300)
    check(page.evaluate("() => UI.currentUnit().key") == 'imp', 'next up is 7.8')
    check('Improper' in page.inner_text('.nextup h1'), 'home next-up card shows 7.8')

    # ---- lessons
    page.evaluate("() => UI.go({ name: 'unit', unit: 'imp', tab: 'learn' })"); page.wait_for_timeout(300)
    n = page.evaluate("() => M.LESSONS.imp.length")
    for i in range(n):
        o = page.query_selector('#lc .opt')
        if o: o.click(); page.wait_for_timeout(60)
        nb = page.query_selector('[data-act="lessonNav"][data-d="1"]')
        if nb: nb.click(); page.wait_for_timeout(120)
    page.click('[data-act="lessonDone"]'); page.wait_for_timeout(300)
    check(page.evaluate("() => UI.Store.state.units.imp.lessonDone"), '7.8 lesson done')

    # ---- instant check: exact values and "diverges"
    page.evaluate("() => { UI.Store.state.settings.mode = 'test'; UI.Store.save(); UI.app.focusOff = true; UI.go({ name: 'unit', unit: 'imp', tab: 'practice' }); }"); page.wait_for_timeout(300)
    seen = {'conv': 0, 'div': 0}
    for j in range(16):
        page.click('[data-act="skip"]'); page.wait_for_timeout(150)
        info = page.evaluate(f"() => {{ const p = UI.app.P.p; const a = ({ASCII}); return {{ conv: p.improper.converges, typed: p.improper.converges ? a(p.improper.exact) : 'diverges', tex: p.tex }}; }}")
        if not info['conv'] and seen['div'] % 2 == 0:
            if page.query_selector('#mfT .keypad[hidden]'): page.click('#mfT .kb-toggle'); page.wait_for_timeout(80)
            page.click('#mfT .div-key'); page.wait_for_timeout(80)
            check(page.input_value('#mfT-in') == 'diverges', 'Diverges key types diverges')
            check('iverge' in page.inner_text('#mfT .pv'), 'preview reads Diverges')
        else:
            page.fill('#mfT-in', info['typed']); page.wait_for_timeout(60)
        page.click('[data-act="submitTest"]'); page.wait_for_timeout(200)
        page.wait_for_timeout(800); page.evaluate(DISMISS)
        v = page.evaluate("() => UI.app.P.result && UI.app.P.result.g.verdict")
        seen['conv' if info['conv'] else 'div'] += 1
        if v != 'correct': check(False, f"typed {info['typed']} for {info['tex']} -> {v}")
    print('seen', seen)
    check(seen['conv'] > 2 and seen['div'] > 0, 'met both kinds')
    page.screenshot(path=f'{SHOTS}/i02-instant.png', full_page=True)
    # wrong answers are diagnosed
    for j in range(6):
        page.click('[data-act="nextProblem"]') if page.query_selector('[data-act="nextProblem"]') else page.click('[data-act="skip"]')
        page.wait_for_timeout(150)
        conv = page.evaluate("() => UI.app.P.p.improper.converges")
        page.fill('#mfT-in', 'diverges' if conv else '1'); page.click('[data-act="submitTest"]'); page.wait_for_timeout(200); page.evaluate(DISMISS)
        g = page.evaluate("() => UI.app.P.result.g")
        check(g['verdict'] == 'wrong' and g['score'] <= round(g['outOf'] * 0.3), f"wrong call graded wrong, at most 30% ({'conv' if conv else 'div'} {g['score']}/{g['outOf']})")
        check(page.query_selector('#resultBox .diag') is not None or page.query_selector('#sol .sol-step') is not None, 'wrong answer shows where it broke')
    # half credit for "converges" without a value
    for j in range(10):
        page.click('[data-act="nextProblem"]') if page.query_selector('[data-act="nextProblem"]') else page.click('[data-act="skip"]')
        page.wait_for_timeout(150)
        if page.evaluate("() => UI.app.P.p.improper.converges"): break
    page.fill('#mfT-in', 'converges'); page.click('[data-act="submitTest"]'); page.wait_for_timeout(200)
    g = page.evaluate("() => UI.app.P.result.g")
    check(g['verdict'] == 'almost' and 0 < g['score'] < g['outOf'], f"'converges' alone gets partial credit ({g['score']}/{g['outOf']})")

    # ---- quiz set: graded at the end
    page.evaluate("() => { UI.Store.state.settings.mode = 'set'; UI.Store.save(); delete UI.Store.state.sets.imp; UI.app.SET.imp = null; UI.go({ name: 'unit', unit: 'imp', tab: 'practice' }); }"); page.wait_for_timeout(400)
    fe = page.query_selector('[data-act="focusExit"]')
    if fe: fe.click(); page.wait_for_timeout(200)
    nitems = page.evaluate("() => UI.app.SET.imp.items.length")
    for i in range(nitems):
        typed = page.evaluate(f"() => {{ const S = UI.app.SET.imp; const p = S.items[S.i].p; const a = ({ASCII}); return p.improper.converges ? a(p.improper.exact) : 'diverges'; }}")
        if i == nitems - 1: typed = 'converges' if typed == 'diverges' else 'diverges'
        inp = page.query_selector('.answer-card input, #mfS-in, .mathin input')
        inp.fill(typed); page.wait_for_timeout(60)
        nb = page.query_selector('#setNext')
        if nb: nb.click(); page.wait_for_timeout(150)
    page.click('[data-act="setReview"]'); page.wait_for_timeout(250)
    page.click('[data-act="setGrade"]'); page.wait_for_timeout(600)
    res = page.evaluate("() => UI.app.SET.imp.results.map((r) => [r.g.verdict, r.g.score, r.g.outOf])")
    print(res)
    check(all(r[0] == 'correct' for r in res[:-1]) and res[-1][0] != 'correct', 'set grades exact values and diverges right, catches the wrong call')
    page.screenshot(path=f'{SHOTS}/i03-set-report.png', full_page=True)

    # ---- boss quiz, then everything is mastered
    page.wait_for_timeout(900); page.evaluate(DISMISS)
    page.evaluate("() => { UI.Store.state.units.imp.mastery = 100; UI.Store.save(); UI.app.Q = null; UI.go({ name: 'unit', unit: 'imp', tab: 'quiz' }); }"); page.wait_for_timeout(300)
    page.click('[data-act="startQuiz"]'); page.wait_for_timeout(200)
    opts_ok = page.evaluate("() => UI.app.Q.qs.every((q) => q.opts.filter((o) => o.correct).length === 1 && new Set(q.opts.map((o) => o.tex)).size === q.opts.length)")
    check(opts_ok, 'boss quiz options: one right answer, no duplicates')
    has_div = page.evaluate("() => UI.app.Q.qs.some((q) => q.opts.some((o) => /Diverges/i.test(o.tex)))")
    check(has_div, 'boss quiz offers Diverges as a choice')
    page.screenshot(path=f'{SHOTS}/i04-boss.png', full_page=False)
    for i in range(8):
        k = page.evaluate("() => UI.app.Q.qs[UI.app.Q.i].opts.findIndex((o) => o.correct)")
        page.click(f'[data-act="qpick"][data-k="{k}"]'); page.wait_for_timeout(60)
        if i < 7: page.click('[data-act="qnav"][data-d="1"]'); page.wait_for_timeout(60)
    page.click('[data-act="qfinish"]'); page.wait_for_timeout(900)
    txt = page.inner_text('body')
    check('All five sections' in txt, 'finishing 7.8 says all five sections are mastered')
    page.evaluate("() => { document.querySelectorAll('.modal, .modal-scrim').forEach((e) => e.remove()); UI.go({ name: 'test' }); }"); page.wait_for_timeout(300)
    check(page.query_selector('[data-act="tsStart"]') is not None, 'Test Simulator open after all five')
    print('errors', errors)
    check(not errors, 'no console errors')
    b.close()
print('FAILS', len(fails))
for f in fails: print(' -', f)
