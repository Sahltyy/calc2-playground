import os
from playwright.sync_api import sync_playwright
katex = open('node_modules/katex/dist/katex.min.js').read()
errors = []
with sync_playwright() as p:
    b = p.chromium.launch(); page = b.new_page(viewport={'width':1280,'height':900})
    page.on('pageerror', lambda e: errors.append(('pageerror', str(e))))
    page.on('console', lambda m: errors.append(('console', m.text)) if m.type == 'error' else None)
    page.route('**/katex.min.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body=katex))
    page.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=''))
    page.goto(('file://' + os.path.abspath('dist/test.html'))); page.wait_for_timeout(500)
    page.evaluate("""() => { window.__texErr = []; const orig = katex.renderToString; katex.renderToString = (s, o) => { try { orig(s, Object.assign({}, o, {throwOnError: true})); } catch (e) { window.__texErr.push(String(s).slice(0,120) + ' :: ' + e.message.slice(0,100)); } return orig(s, o); }; UI.Store.state.settings.unlockAll = true; }""")
    for u in ['ibp','trig','tsub','pf','imp']:
        n = page.evaluate(f"() => M.LESSONS['{u}'].length")
        for i in range(n):
            page.evaluate(f"() => {{ UI.app.L['{u}'] = {i}; UI.go({{name:'unit', unit:'{u}', tab:'learn'}}); }}"); page.wait_for_timeout(60)
            for sel in ['[data-l="next"]','[data-l="next"]','[data-l="next"]','[data-w="1"]','[data-s="1"]','[data-s="3"]','.rstep[data-i="2"]','.rstep[data-i="4"]','[data-r="all"]','[data-b="fill"]','[data-b="fill"]','[data-b="fill"]','[data-b="fill"]','[data-b="fill"]','[data-d="go"]','[data-d="go"]','[data-d="go"]','[data-t="1"]','[data-t="2"]','[data-k="sin"]','[data-k="cos"]','[data-k="tan"]','[data-k="csc"]','[data-k="sec"]','[data-k="cot"]','[data-f="flip"]','[data-c="a"]','[data-c="b"]','#lc .opt']:
                for el in page.query_selector_all('#lv ' + sel if not sel.startswith('#lc') else sel)[:1]:
                    try: el.click(); page.wait_for_timeout(40)
                    except Exception: pass
            for sl in page.query_selector_all('#lv input[type=range]'):
                try: sl.fill(sl.get_attribute('max') or '1'); sl.fill(sl.get_attribute('min') or '0')
                except Exception: pass
    page.click('.dock-btn[data-tool="formulas"]'); page.wait_for_timeout(300)
    for k in ['By parts','Trig','Trig sub','Partial fractions','Improper','Basics']:
        page.click(f'[data-s="{k}"]'); page.wait_for_timeout(60)
    page.click('[data-close-tool]'); page.wait_for_timeout(200)
    # every study-guide page, every step shown, every visual poked
    page.evaluate("""() => { for (const u of UI.ORDER) for (const s of M.GUIDE[u].scenarios) UI.GS.open[u + '/' + s.key] = 99; }""")
    for u in ['ibp','trig','tsub','pf','imp']:
        page.evaluate(f"() => UI.go({{name:'guide', unit:'{u}'}})"); page.wait_for_timeout(80)
        for el in page.query_selector_all('.g-pic summary, #gRecipe .rstep'):
            try: el.click(); page.wait_for_timeout(30)
            except Exception: pass
        keys = page.evaluate(f"() => M.GUIDE['{u}'].scenarios.map(s => s.key)")
        for k in keys:
            page.evaluate(f"() => UI.go({{name:'guide', unit:'{u}', sc:'{k}'}})"); page.wait_for_timeout(80)
            for sel in ['[data-r="all"]','[data-l="next"]','[data-c="a"]','[data-c="b"]','[data-s="1"]','[data-s="3"]','[data-w="1"]']:
                for el in page.query_selector_all('#gVis ' + sel)[:1]:
                    try: el.click(); page.wait_for_timeout(30)
                    except Exception: pass
    page.evaluate("() => { UI.GS.which = []; UI.go({name:'guide', which:true}); }")
    nodes = page.evaluate("() => { const t = new Set(Object.keys(M.WHICH)); Object.values(M.WHICH).forEach((x) => (x.choices ? x.choices.map((c) => c.to) : [x.yes, x.no]).forEach((v) => t.add(v))); return [...t]; }")
    for nk in nodes:
        page.evaluate(f"() => {{ const W = M.WHICH; const path = []; const find = (n, target, acc) => {{ if (n === target) return acc; const x = W[n]; if (!x) return null; const outs = x.choices ? x.choices.map((c, i) => [c.to, i]) : [[x.yes, 'yes'], [x.no, 'no']]; for (const [to, a] of outs) {{ const r = find(to, target, acc.concat([a])); if (r) return r; }} return null; }}; UI.GS.which = find('start', '{nk}', []) || []; UI.render(); }}"); page.wait_for_timeout(40)
    page.click('.dock-btn[data-tool="circle"]'); page.wait_for_timeout(300)
    for i in range(16): page.evaluate(f"() => document.querySelector('[data-p=\"{i}\"]').dispatchEvent(new MouseEvent('click', {{bubbles:true}}))")
    page.evaluate("() => { const r = M.rng(5); for (let i = 0; i < 300; i++) { const q = M.methodQuestion(r); UI.tex(q.tex, true); UI.rich(q.why); } Object.values(M.TRAPS).forEach(t => UI.rich(t.patch)); }")
    rendered = page.evaluate("() => document.querySelectorAll('.w-res, .w-q').length")
    print('which pages ok', len(nodes), rendered)
    page.evaluate("() => UI.go({name:'traps'})")
    errs = page.evaluate("() => window.__texErr")
    katexErrNodes = page.evaluate("() => document.querySelectorAll('.katex-error').length")
    b.close()
print('tex errors:', len(errs)); [print(' ', e) for e in errs[:20]]
print('page errors:', errors[:10])
