import os
import sys, json, time
from playwright.sync_api import sync_playwright
SHOTS = os.environ.get('SHOTS', os.path.abspath('test/shots'))
os.makedirs(SHOTS, exist_ok=True)
body = open('dist/calc2-playground.html').read()
skeleton = '<!doctype html><html><head><meta charset=utf8><meta name=viewport content="width=device-width,initial-scale=1,viewport-fit=cover"><style>:root{color-scheme:light;padding-top:env(safe-area-inset-top);padding-bottom:env(safe-area-inset-bottom)}body{margin:0;font:14px system-ui}img{max-width:100%}[hidden]{display:none!important}</style></head><body>' + body + '</body></html>'
open('dist/test.html','w').write(skeleton)
katex = open('node_modules/katex/dist/katex.min.js').read()
errors = []
def setup(page):
    page.on('console', lambda m: errors.append(('console', m.text)) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(('pageerror', str(e))))
    page.route('**/katex.min.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body=katex))
    page.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=''))
    page.route('https://fonts.gstatic.com/**', lambda r: r.abort())
def step(name): print('--', name, flush=True)
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 1280, 'height': 900}, color_scheme='light')
    page = ctx.new_page(); setup(page)
    page.goto(('file://' + os.path.abspath('dist/test.html'))); page.wait_for_timeout(800)
    step('home'); page.screenshot(path=f'{SHOTS}/01-home-desktop.png', full_page=True)
    page.click('.station-card[data-u="ibp"]'); page.wait_for_timeout(300)
    step('lessons')
    for i in range(8):
        v = page.query_selector('#lv')
        if v:
            for sel in ['[data-r="next"]', '[data-b="fill"]', '[data-d="go"]', '.pair [data-o]', '[data-t="1"]', '[data-k="tan"]', '[data-f="flip"]', '[data-c="a"]']:
                el = page.query_selector('#lv ' + sel)
                if el:
                    try: el.click(); page.wait_for_timeout(120)
                    except Exception as e: pass
            sl = page.query_selector('#lv input[type=range]')
            if sl: sl.fill('4')
        opt = page.query_selector('#lc .opt')
        if opt: opt.click()
        if i == 1: page.screenshot(path=f'{SHOTS}/02-lesson-area.png', full_page=False)
        nxt = page.query_selector('[data-act="lessonNav"][data-d="1"]')
        if nxt: nxt.click(); page.wait_for_timeout(150)
        else: break
    page.click('[data-act="lessonDone"]'); page.wait_for_timeout(300)
    step('practice steps')
    page.click('[data-act="focusExit"]'); page.wait_for_timeout(200)
    page.click('[data-act="mode"][data-m="steps"]'); page.wait_for_timeout(200)
    page.click('[data-act="skip"]'); page.wait_for_timeout(200)
    for k in range(12):
        info = page.evaluate("""() => { const P = UI.app.P; if (!P || P.done) return null; const s = P.p.steps[P.cur]; return {cur: P.cur, kind: s.check ? s.check.kind : null, status: P.steps[P.cur].status, ans: P.p.answer.ascii}; }""")
        if not info: break
        if info['status'] != 'current':
            page.click('[data-act="stepNext"]'); page.wait_for_timeout(150); continue
        kind = info['kind']
        if kind == 'choice':
            idx = page.evaluate("() => { const P=UI.app.P; const s=P.p.steps[P.cur]; return s.check.options.findIndex(o=>o.ok); }")
            page.click(f'#step{info["cur"]} .opt[data-k="{idx}"]')
        elif kind == 'final':
            page.fill(f'#mf{info["cur"]}-in', info['ans'] + ' + C'); page.click(f'[data-act="checkStep"][data-i="{info["cur"]}"]')
        elif kind in ('expr', 'num'):
            if k == 2:
                page.fill(f'#mf{info["cur"]}-in', 'x^2'); page.click(f'[data-act="checkStep"][data-i="{info["cur"]}"]'); page.wait_for_timeout(150)
            page.click(f'[data-act="showStep"][data-i="{info["cur"]}"]')
        else:
            pass
        page.wait_for_timeout(200)
        nb = page.query_selector('[data-act="stepNext"]')
        if nb: nb.click(); page.wait_for_timeout(200)
    page.wait_for_timeout(400)
    page.screenshot(path=f'{SHOTS}/03-practice-steps-result.png', full_page=True)
    step('test mode correct')
    page.click('[data-act="nextProblem"]') if page.query_selector('[data-act="nextProblem"]') else None
    page.wait_for_timeout(200)
    page.click('[data-act="mode"][data-m="test"]'); page.wait_for_timeout(200)
    ans = page.evaluate("() => UI.app.P.p.definite ? String(UI.app.P.p.definite.value) : UI.app.P.p.answer.ascii + ' + C'")
    page.fill('#mfT-in', ans); page.wait_for_timeout(100)
    page.click('[data-act="submitTest"]'); page.wait_for_timeout(400)
    v = page.evaluate("() => UI.app.P.result && UI.app.P.result.g.verdict")
    print('verdict', v)
    step('test mode wrong (twin)')
    page.click('[data-act="twin"]'); page.wait_for_timeout(200)
    wrong = page.evaluate("() => { const p = UI.app.P.p; if (p.definite) return '0.123'; const m = p.mistakes.find(m => m.tex); return null; }")
    # build a wrong answer: negate the right one
    neg = page.evaluate("() => UI.app.P.p.definite ? '0.5' : '-(' + UI.app.P.p.answer.ascii + ')'")
    page.fill('#mfT-in', neg); page.click('[data-act="submitTest"]'); page.wait_for_timeout(400)
    page.click('[data-act="solNext"]'); page.wait_for_timeout(150); page.click('[data-act="solAll"]'); page.wait_for_timeout(150)
    page.screenshot(path=f'{SHOTS}/04-test-wrong.png', full_page=True)
    step('quiz')
    page.evaluate("() => { UI.Store.state.units.ibp.mastery = 100; UI.Store.save(); }")
    page.click('[data-act="tab"][data-tab="quiz"]'); page.wait_for_timeout(200)
    page.click('[data-act="startQuiz"]'); page.wait_for_timeout(300)
    for q in range(8):
        page.click(f'[data-act="qjump"][data-k="{q}"]'); page.wait_for_timeout(60)
        idx = page.evaluate("() => UI.app.Q.qs[UI.app.Q.i].opts.findIndex(o => o.correct)")
        if q == 3: idx = (idx + 1) % 4
        page.click(f'[data-act="qpick"][data-k="{idx}"]'); page.wait_for_timeout(80)
    page.click('[data-act="qfinish"]')
    page.wait_for_timeout(800)
    page.screenshot(path=f'{SHOTS}/06-quiz-done.png', full_page=False)
    if page.query_selector('.modal'): page.click('.modal [data-act="closeModal"]')
    print('passed ibp:', page.evaluate("() => UI.Store.state.units.ibp.quizPassed"))
    step('tools')
    for t in ['calc', 'formulas', 'scratch', 'graph', 'circle', 'timer', 'ask']:
        page.click(f'.dock-btn[data-tool="{t}"]'); page.wait_for_timeout(380)
        if t == 'calc':
            page.fill('#calcIn', '(e^2+1)/4'); page.keyboard.press('Enter'); page.wait_for_timeout(100)
            page.fill('#calcIn', 'sin(pi/6)+log(100)'); page.wait_for_timeout(100)
            print('calc:', page.inner_text('#calcRes'), '|', page.inner_text('#calcEx'))
        if t == 'scratch':
            box = page.query_selector('.scratch-wrap canvas').bounding_box()
            page.mouse.move(box['x']+40, box['y']+40); page.mouse.down(); page.mouse.move(box['x']+140, box['y']+90, steps=8); page.mouse.up()
        if t == 'circle': page.click('[data-p="3"] circle >> nth=0', force=True)
        if t == 'timer': page.click('#tmGo'); page.wait_for_timeout(200); page.click('#tmGo')
        if t == 'graph': page.fill('[data-f="0"]', 'x*sin(x)'); page.wait_for_timeout(100)
        page.screenshot(path=f'{SHOTS}/07-tool-{t}.png', full_page=False)
    page.click('[data-close-tool]'); page.wait_for_timeout(200)
    step('graph it from practice')
    page.click('[data-act="tab"][data-tab="practice"]'); page.wait_for_timeout(200)
    page.click('[data-act="graphIt"]'); page.wait_for_timeout(500)
    page.click('[data-close-tool]')
    step('method game')
    page.click('[data-act="home"]'); page.wait_for_timeout(200)
    page.click('.nextup [data-act="method"]'); page.wait_for_timeout(200)
    page.click('[data-act="mStart"]'); page.wait_for_timeout(200)
    for j in range(3):
        page.click('[data-act="mPick"][data-m="usub"]'); page.wait_for_timeout(2400)
    page.evaluate("() => { UI.app.MG.left = 0.2; }"); page.wait_for_timeout(500)
    page.screenshot(path=f'{SHOTS}/08-method-end.png', full_page=False)
    step('test sim + traps + settings')
    page.evaluate("() => { UI.Store.state.settings.unlockAll = true; UI.Store.save(); UI.go({name:'test'}); }"); page.wait_for_timeout(200)
    page.click('[data-act="tsStart"]'); page.wait_for_timeout(300)
    for j in range(14):
        page.click('[data-act="tsPick"][data-k="0"]'); page.wait_for_timeout(60)
        if page.query_selector('[data-act="tsFinish"]'): page.click('[data-act="tsFinish"]'); break
        page.click('[data-act="tsNav"][data-d="1"]'); page.wait_for_timeout(60)
    page.wait_for_timeout(300)
    page.screenshot(path=f'{SHOTS}/09-test-sim.png', full_page=False)
    page.click('[data-act="traps"]'); page.wait_for_timeout(200)
    page.screenshot(path=f'{SHOTS}/10-traps.png', full_page=False)
    page.click('[data-act="settings"]'); page.wait_for_timeout(200); page.click('[data-act="closeModal"]')
    for u in ['trig', 'tsub', 'pf', 'imp']:
        page.evaluate(f"() => UI.go({{name:'unit', unit:'{u}', tab:'learn'}})"); page.wait_for_timeout(200)
        for i in range(8):
            for sel in ['[data-r="all"]', '[data-t="2"]', '[data-k="sec"]', '[data-f="flip"]', '[data-c="b"]']:
                el = page.query_selector('#lv ' + sel)
                if el:
                    try: el.click(); page.wait_for_timeout(80)
                    except Exception: pass
            nxt = page.query_selector('[data-act="lessonNav"][data-d="1"]')
            if nxt: nxt.click(); page.wait_for_timeout(100)
            else: break
        page.evaluate(f"() => UI.go({{name:'unit', unit:'{u}', tab:'practice'}})"); page.wait_for_timeout(200)
        for r in range(6):
            page.click('[data-act="skip"]'); page.wait_for_timeout(120)
    page.evaluate("() => UI.go({name:'unit', unit:'tsub', tab:'practice'})"); page.wait_for_timeout(200)
    page.click('[data-act="mode"][data-m="steps"]'); page.wait_for_timeout(200)
    page.screenshot(path=f'{SHOTS}/11-tsub-steps.png', full_page=True)
    ctx.close()
    # mobile dark
    ctx = b.new_context(viewport={'width': 390, 'height': 844}, color_scheme='dark', has_touch=True, is_mobile=True, device_scale_factor=2)
    page = ctx.new_page(); setup(page)
    page.goto(('file://' + os.path.abspath('dist/test.html'))); page.wait_for_timeout(800)
    page.screenshot(path=f'{SHOTS}/12-mobile-home-dark.png', full_page=False)
    page.evaluate("() => { UI.Store.state.settings.unlockAll = true; UI.app.focusOff = true; UI.go({name:'unit', unit:'pf', tab:'practice'}); }"); page.wait_for_timeout(300)
    page.click('[data-act="mode"][data-m="test"]'); page.wait_for_timeout(300)
    page.screenshot(path=f'{SHOTS}/13-mobile-practice-dark.png', full_page=True)
    sw = page.evaluate("() => document.documentElement.scrollWidth")
    print('mobile scrollWidth', sw)
    ctx.close(); b.close()
print('ERRORS', len(errors))
for e in errors[:30]: print(e)
