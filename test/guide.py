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
fails = []
def check(cond, msg):
    if not cond: fails.append(msg); print('FAIL', msg, flush=True)
def setup(page):
    page.on('console', lambda m: errors.append(('console', m.text)) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(('pageerror', str(e))))
    page.route('**/katex.min.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body=katex))
    page.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=''))
    page.route('https://fonts.gstatic.com/**', lambda r: r.abort())
def step(name): print('--', name, flush=True)
def overflow(page):
    return page.evaluate("() => document.documentElement.scrollWidth - window.innerWidth")
def katex_errors(page):
    return page.evaluate("() => document.querySelectorAll('.katex-error').length")

def solve_steps(page):
    """finish a step-by-step practice problem by picking right options / showing steps"""
    for k in range(16):
        info = page.evaluate("""() => { const P = UI.app.P; if (!P || P.done) return null; const s = P.p.steps[P.cur]; return {cur: P.cur, kind: s.check ? s.check.kind : null, status: P.steps[P.cur].status}; }""")
        if not info: return True
        if info['status'] != 'current':
            nb = page.query_selector('[data-act="stepNext"]')
            if nb: nb.click(); page.wait_for_timeout(120); continue
            return False
        kind = info['kind']
        if kind == 'choice':
            idx = page.evaluate("() => { const P=UI.app.P; const s=P.p.steps[P.cur]; return s.check.options.findIndex(o=>o.ok); }")
            page.click(f'#step{info["cur"]} .opt[data-k="{idx}"]')
        elif kind == 'improper':
            val = page.evaluate("() => { const P=UI.app.P; const c=P.p.steps[P.cur].check; return c.expect.converges ? P.p.improper.exact.replace(/\\\\frac\\{([^}]*)\\}\\{([^}]*)\\}/g,'($1)/($2)').replace(/\\\\pi/g,'pi').replace(/\\\\ln/g,'ln').replace(/\\\\sqrt\\{([^}]*)\\}/g,'sqrt($1)').replace(/[{}\\\\]/g,'') : 'diverges'; }")
            page.fill(f'#mf{info["cur"]}-in', val); page.click(f'[data-act="checkStep"][data-i="{info["cur"]}"]')
            page.wait_for_timeout(150)
            st = page.evaluate("() => UI.app.P.steps[UI.app.P.cur] && UI.app.P.steps[UI.app.P.cur].status")
            if st == 'current':
                page.click(f'[data-act="showStep"][data-i="{info["cur"]}"]')
        elif kind in ('expr', 'num', 'final'):
            page.click(f'[data-act="showStep"][data-i="{info["cur"]}"]')
        else:
            nb = page.query_selector('[data-act="stepNext"]')
            if nb: nb.click()
        page.wait_for_timeout(140)
    return page.evaluate("() => !!(UI.app.P && UI.app.P.done)")

with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 1280, 'height': 900}, color_scheme='light')
    page = ctx.new_page(); setup(page)
    page.goto(('file://' + os.path.abspath('dist/test.html'))); page.wait_for_timeout(800)

    step('home -> study guide')
    check(page.query_selector('.guide-card') is not None, 'home guide card')
    page.click('.nu-more [data-act="guide"]'); page.wait_for_timeout(300)
    check(page.evaluate("() => UI.app.route.name") == 'guide', 'route guide')
    page.screenshot(path=f'{SHOTS}/g01-section-ibp.png', full_page=True)

    step('every section + scenario')
    units = page.evaluate("() => UI.ORDER")
    total_sc = 0
    for u in units:
        page.evaluate("() => UI.go({ name: 'guide', unit: 'ibp' })"); page.wait_for_timeout(150)
        page.click(f'.g-tabs [data-u="{u}"]'); page.wait_for_timeout(250)
        check(page.evaluate("() => UI.app.route.unit") == u, f'tab {u}')
        n_tiles = len(page.query_selector_all('.g-tile'))
        n_sc = page.evaluate(f"() => M.GUIDE['{u}'].scenarios.length")
        check(n_tiles == n_sc, f'{u} tiles {n_tiles} vs {n_sc}')
        check(page.query_selector('#gRecipe .rstep') is not None, f'{u} recipe')
        pills = page.query_selector_all('#gRecipe .rstep')
        if len(pills) > 2:
            pills[2].click(); page.wait_for_timeout(80)
            check('Step 3' in page.inner_text('#gRecipe .rdesc'), f'{u} recipe tap')
        det = page.query_selector('.g-pic summary')
        if det: det.click(); page.wait_for_timeout(120)
        check(katex_errors(page) == 0, f'{u} section katex')
        if u == 'pf': page.screenshot(path=f'{SHOTS}/g02-section-pf.png', full_page=True)
        keys = page.evaluate(f"() => M.GUIDE['{u}'].scenarios.map(s => s.key)")
        for k in keys:
            total_sc += 1
            page.evaluate(f"() => UI.go({{ name: 'guide', unit: '{u}', sc: '{k}' }})"); page.wait_for_timeout(160)
            check(page.query_selector('.g-stepcard') is not None, f'{u}/{k} steps card')
            nsteps = page.evaluate(f"() => M.GUIDE['{u}'].scenarios.find(s=>s.key==='{k}').steps.length")
            check(len(page.query_selector_all('#gSteps .gstep')) == nsteps, f'{u}/{k} step rows')
            check(len(page.query_selector_all('#gSteps .gstep.shown')) == 1, f'{u}/{k} one shown at start')
            page.click('[data-act="gNext"]'); page.wait_for_timeout(60)
            check(len(page.query_selector_all('#gSteps .gstep.shown')) == 2, f'{u}/{k} next step')
            page.click('[data-act="gAll"]'); page.wait_for_timeout(60)
            check(len(page.query_selector_all('#gSteps .gstep.shown')) == nsteps, f'{u}/{k} show all')
            check(katex_errors(page) == 0, f'{u}/{k} katex')
            # interact with the visual if there is one
            for sel in ['[data-r="next"]', '[data-l="next"]', '[data-c="a"]', '[data-c="b"]', '[data-s="2"]', '[data-w="1"]', '.rstep[data-i="1"]']:
                el = page.query_selector('#gVis ' + sel)
                if el:
                    try: el.click(); page.wait_for_timeout(60)
                    except Exception: pass
            sl = page.query_selector('#gVis input[type=range]')
            if sl: sl.fill(sl.get_attribute('max') or '1')
            if (u, k) in [('pf', 'distinct'), ('imp', 'inside_asym'), ('ibp', 'tabular')]:
                page.screenshot(path=f'{SHOTS}/g03-sc-{u}-{k}.png', full_page=True)
    print('scenarios visited', total_sc)
    check(total_sc == 28, 'scenario count 28')

    step('cover the math, tap a hidden step')
    page.evaluate("() => UI.go({ name: 'guide', unit: 'pf', sc: 'distinct' })"); page.wait_for_timeout(200)
    check(len(page.query_selector_all('#gSteps .gstep.shown')) == 6, 'open steps remembered')
    page.click('[data-act="gHide"]'); page.wait_for_timeout(100)
    check(len(page.query_selector_all('#gSteps .gstep.shown')) == 0, 'cover hides all')
    page.click('#gst2 [data-act="gStep"]'); page.wait_for_timeout(80)
    check(len(page.query_selector_all('#gSteps .gstep.shown')) == 3, 'tap step 3 shows 1-3')

    step('try one (unlocked section)')
    page.click('[data-act="gTry"]'); page.wait_for_timeout(300)
    r = page.evaluate("() => ({ route: UI.app.route, mode: UI.app.P.mode, guide: UI.app.P.guide, fam: UI.app.P.p.family, sc: M.guideScenario('pf', UI.app.P.p).key })")
    print(r)
    check(r['route']['name'] == 'unit' and r['route']['unit'] == 'pf', 'try one route')
    check(r['mode'] == 'steps' and r['guide'] and r['guide']['sc'] == 'distinct', 'try one is guide steps problem')
    check(r['sc'] == 'distinct', 'try one scenario matches')
    check('study guide' in page.inner_text('.problem-card .eyebrow').lower(), 'guide eyebrow')
    check(page.query_selector('.backlink[data-act="gReturn"]') is not None, 'back to guide link')
    check(page.query_selector('.preview-note') is not None, 'pf preview note (locked)')
    page.screenshot(path=f'{SHOTS}/g04-try-pf.png', full_page=False)
    step('step list drawer on a guide problem')
    page.click('.tool-row [data-act="stepList"]'); page.wait_for_timeout(300)
    check(page.query_selector('#drawer.open .sl-list') is not None, 'drawer open with list')
    check('Case 1' in page.inner_text('#drawer .sl-name'), 'drawer scenario name')
    page.click('#drawer .sl-list li:nth-child(1) input'); page.wait_for_timeout(80)
    page.click('#drawer .sl-list li:nth-child(2) input'); page.wait_for_timeout(80)
    check(len(page.query_selector_all('#drawer .sl-list li.done')) == 2, 'ticks stick')
    page.click('#drawer [data-sl="ex"]'); page.wait_for_timeout(80)
    check(page.query_selector('#drawer .sl-exq') is not None and page.query_selector('#drawer .sl-ex .math-lines') is not None, 'worked example in drawer')
    page.screenshot(path=f'{SHOTS}/g05-drawer.png', full_page=False)
    page.click('#drawer [data-sl="ex"]'); page.wait_for_timeout(60)
    page.click('[data-close-tool]'); page.wait_for_timeout(200)
    ok = solve_steps(page)
    check(ok, 'solved the guide problem')
    page.wait_for_timeout(300)
    check(page.query_selector('#resultBox [data-act="gReturn"]') is not None, 'result has back to step list')
    g = page.evaluate("() => UI.Store.state.guide")
    print('guide store', g)
    check(g.get('pf/distinct', {}).get('n') == 1, 'guide attempt recorded')
    page.click('[data-act="twin"]'); page.wait_for_timeout(250)
    r2 = page.evaluate("() => ({ guide: UI.app.P.guide, sc: M.guideScenario('pf', UI.app.P.p).key })")
    check(r2['guide'] and r2['sc'] == 'distinct', 'twin keeps scenario')
    page.click('[data-act="skip"]'); page.wait_for_timeout(250)
    r3 = page.evaluate("() => ({ guide: UI.app.P.guide, sc: M.guideScenario('pf', UI.app.P.p).key })")
    check(r3['guide'] and r3['sc'] == 'distinct', 'new problem keeps scenario')
    page.click('.backlink[data-act="gReturn"]'); page.wait_for_timeout(250)
    check(page.evaluate("() => UI.app.route.sc") == 'distinct', 'returned to scenario')
    check(page.query_selector('.g-score') is not None, 'score line on try card')
    # leaving via the map clears the guide problem
    page.click('[data-act="home"]') if page.query_selector('.backlink[data-act="home"]') else None
    page.evaluate("() => UI.go({ name: 'home' })"); page.wait_for_timeout(200)

    step('which method flow')
    page.click('.guide-card [data-act="whichStart"]'); page.wait_for_timeout(250)
    check(page.query_selector('.w-q') is not None, 'which question')
    page.screenshot(path=f'{SHOTS}/g06-which-q1.png', full_page=True)
    page.click('[data-act="wNo"]'); page.wait_for_timeout(120)   # not u-sub
    page.click('[data-act="wNo"]'); page.wait_for_timeout(120)   # not improper
    page.click('[data-act="wYes"]'); page.wait_for_timeout(120)  # rational
    page.click('[data-act="wNo"]'); page.wait_for_timeout(120)   # proper
    check(len(page.query_selector_all('.w-choice')) == 4, 'factor choices')
    page.click('.w-choice[data-i="1"]'); page.wait_for_timeout(150)
    check(page.query_selector('.w-res') is not None and 'repeated' in page.inner_text('.w-res').lower(), 'which result repeated')
    check(len(page.query_selector_all('.w-trail li')) == 5, 'trail 5')
    page.screenshot(path=f'{SHOTS}/g07-which-result.png', full_page=True)
    page.click('[data-act="wUndo"]'); page.wait_for_timeout(100)
    check(len(page.query_selector_all('.w-choice')) == 4, 'undo back to choices')
    page.click('[data-act="wReset"]'); page.wait_for_timeout(100)
    page.click('[data-act="wNo"]'); page.click('[data-act="wYes"]'); page.wait_for_timeout(120)
    check(len(page.query_selector_all('.w-choice')) == 6, 'improper choices')
    page.click('.w-choice[data-i="4"]'); page.wait_for_timeout(120)
    page.click('.w-res [data-act="gOpen"]'); page.wait_for_timeout(250)
    check(page.evaluate("() => UI.app.route.sc") == 'inside_asym', 'which -> scenario')

    step('try one on a locked section (7.8)')
    page.click('[data-act="gTry"]'); page.wait_for_timeout(300)
    r = page.evaluate("() => ({ route: UI.app.route, locked: UI.isLocked('imp'), t: UI.app.P.p.improper && UI.app.P.p.improper.type })")
    print(r)
    check(r['route']['name'] == 'unit' and r['route']['unit'] == 'imp' and r['locked'], 'imp preview route')
    check(r['t'] == 'interior', 'imp try one is interior')
    check(page.query_selector('.preview-note') is not None, 'imp preview note')
    check(page.query_selector('.imp-pic svg') is not None, 'imp picture on step 1')
    page.screenshot(path=f'{SHOTS}/g08-try-imp.png', full_page=False)
    ok = solve_steps(page)
    check(ok, 'solved imp guide problem')
    # reload keeps the preview route
    page.reload(); page.wait_for_timeout(800)
    check(page.evaluate("() => UI.app.route.name") == 'unit', 'reload keeps preview')
    page.evaluate("() => UI.go({ name: 'unit', unit: 'imp' })"); page.wait_for_timeout(200)
    check(page.evaluate("() => UI.app.route.name") == 'home', 'locked unit without peek bounces home')

    step('step list in a quiz set')
    page.evaluate("() => { UI.Store.state.settings.unlockAll = true; UI.Store.state.units.trig.lessonDone = true; UI.Store.state.settings.mode = 'set'; UI.Store.save(); UI.go({ name: 'unit', unit: 'trig', tab: 'practice' }); }"); page.wait_for_timeout(400)
    fe = page.query_selector('[data-act="focusExit"]')
    if fe: fe.click(); page.wait_for_timeout(200)
    page.click('[data-act="stepList"]'); page.wait_for_timeout(300)
    nm = page.inner_text('#drawer .sl-name')
    exp = page.evaluate("() => { const S = UI.app.SET.trig; return M.guideScenario('trig', S.items[S.i].p).name; }")
    check(nm == exp, f'set drawer scenario {nm} vs {exp}')
    # moving to the next set problem refreshes the open list
    page.evaluate("() => UI.ACT.setJump({ dataset: { k: 1 } })"); page.wait_for_timeout(1000)
    nm2 = page.inner_text('#drawer .sl-name')
    exp2 = page.evaluate("() => { const S = UI.app.SET.trig; return M.guideScenario('trig', S.items[S.i].p).name; }")
    check(nm2 == exp2, f'set drawer refresh {nm2} vs {exp2}')
    page.click('#drawer [data-sl="open"]'); page.wait_for_timeout(250)
    check(page.evaluate("() => UI.app.route.name") == 'guide', 'drawer -> guide')
    check(page.query_selector('#drawer.open') is None, 'drawer closed after open-in-guide')

    print('errors', errors)
    check(not errors, 'no console errors')
    ctx.close()

    step('phone, light + dark')
    for scheme in ['light', 'dark']:
        ctx = b.new_context(viewport={'width': 390, 'height': 844}, color_scheme=scheme, is_mobile=True, has_touch=True, device_scale_factor=2)
        page = ctx.new_page(); setup(page)
        page.goto(('file://' + os.path.abspath('dist/test.html'))); page.wait_for_timeout(800)
        page.evaluate("() => { UI.Store.state.settings.unlockAll = true; UI.Store.save(); }")
        for route, name in [("{name:'guide',unit:'imp'}", 'sec-imp'), ("{name:'guide',unit:'imp',sc:'end_asym'}", 'sc-imp-end'), ("{name:'guide',unit:'pf',sc:'divide_first'}", 'sc-pf-div'), ("{name:'guide',which:true}", 'which')]:
            page.evaluate(f"() => UI.go({route})"); page.wait_for_timeout(300)
            if 'sc-' in name and page.query_selector('[data-act="gAll"]'):
                page.click('[data-act="gAll"]'); page.wait_for_timeout(100)
            ov = overflow(page)
            check(ov <= 0, f'{scheme} {name} overflow {ov}')
            page.screenshot(path=f'{SHOTS}/g9-phone-{scheme}-{name}.png', full_page=True)
        page.evaluate("() => UI.go({name:'guide',unit:'pf',sc:'repeated'})"); page.wait_for_timeout(300)
        page.screenshot(path=f'{SHOTS}/g9-phone-{scheme}-sticky.png', full_page=False)
        page.click('[data-act="gTry"]'); page.wait_for_timeout(300)
        page.click('.tool-row [data-act="stepList"]'); page.wait_for_timeout(400)
        page.screenshot(path=f'{SHOTS}/g9-phone-{scheme}-drawer.png', full_page=False)
        print(scheme, 'errors', errors)
        ctx.close()
    b.close()
print('FAILS', len(fails))
for f in fails: print(' -', f)
