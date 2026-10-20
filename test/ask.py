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
# a stand-in for Claude: records what the page sends, streams back a short reply
MOCK = """
window.__calls = [];
const fake = async (input, opts = {}) => {
  window.__calls.push(input);
  const text = 'Try letting $u = x$ first. What is $du$?';
  await new Promise(r => setTimeout(r, 50));
  if (opts.onText) opts.onText({ text, delta: text });
  return { text, truncated: false, modelTierApplied: 'default' };
};
fake.limits = async () => ({ maxPromptBytes: 262144 });
fake.json = async () => ({});
window.claude = { use: async (name) => (name === 'sample' ? fake : null) };
"""
with sync_playwright() as p:
    b = p.chromium.launch()
    ctx = b.new_context(viewport={'width': 1280, 'height': 900})
    ctx.add_init_script(MOCK)
    page = ctx.new_page()
    page.on('console', lambda m: errors.append(('console', m.text)) if m.type == 'error' else None)
    page.on('pageerror', lambda e: errors.append(('pageerror', str(e))))
    page.route('**/katex.min.js', lambda r: r.fulfill(status=200, content_type='application/javascript', body=katex))
    page.route('https://fonts.googleapis.com/**', lambda r: r.fulfill(status=200, content_type='text/css', body=''))
    page.route('https://fonts.gstatic.com/**', lambda r: r.abort())
    page.goto(('file://' + os.path.abspath('dist/test.html'))); page.wait_for_timeout(300)
    page.evaluate("() => { localStorage.clear(); sessionStorage.clear(); }")
    page.reload(); page.wait_for_timeout(500)
    page.evaluate("() => { UI.Store.state.settings.sound = false; UI.Store.state.units.ibp.lessonDone = true; UI.go({name:'unit', unit:'ibp', tab:'practice'}); }"); page.wait_for_timeout(300)
    check(page.query_selector('.problem-card [data-act="setAsk"]') is not None, 'Ask Claude button on the quiz-set problem')
    page.fill('#mfS-in', 'x*sin(2x)/2')
    page.click('[data-act="setAsk"]'); page.wait_for_timeout(450)
    check(page.evaluate("() => document.getElementById('drawer').classList.contains('open')"), 'opens the Ask drawer')
    check('problem 1 of 5' in page.inner_text('#drawerBody .preview'), 'drawer knows which problem')
    chips = [c.inner_text() for c in page.query_selector_all('#drawerBody .chips button')]
    check('How do I start this one?' in chips and 'Hint, not the answer' in chips, f'quiz chips {chips}')
    page.screenshot(path=f'{SHOTS}/30-ask-quiz.png', full_page=False)
    page.click('#drawerBody .chips button >> nth=0'); page.wait_for_timeout(400)
    sent = page.evaluate("() => window.__calls[0][0].content")
    check('graded only at the end' in sent and 'do not give the final answer' in sent, 'Claude is told not to spoil the quiz')
    check('x*sin(2x)/2' in sent, 'Claude sees the typed attempt')
    tex = page.evaluate("() => UI.app.SET.ibp.items[0].p.tex")
    check(tex in sent, 'Claude sees the problem')
    check('Try letting' in page.inner_text('#chatLog'), 'reply shows in the chat')
    check(page.evaluate("() => UI.app.SET.ibp.items[0].ans") == 'x*sin(2x)/2', 'typed answer kept while asking')
    page.fill('#askIn', 'what about the 2x inside?'); page.press('#askIn', 'Enter'); page.wait_for_timeout(400)
    check(len(page.query_selector_all('#chatLog .msg')) == 4, 'follow-up question in same thread')
    page.click('[data-close-tool]'); page.wait_for_timeout(300)
    # problem 2 gets its own thread
    page.click('[data-act="setNav"][data-d="1"]'); page.wait_for_timeout(250)
    page.click('[data-act="setAsk"]'); page.wait_for_timeout(400)
    check(len(page.query_selector_all('#chatLog .msg')) == 0 and 'problem 2 of 5' in page.inner_text('#drawerBody .preview'), 'problem 2 starts a fresh conversation')
    page.click('[data-close-tool]'); page.wait_for_timeout(300)
    page.click('[data-act="setJump"][data-k="0"]'); page.wait_for_timeout(250)
    page.click('[data-act="setAsk"]'); page.wait_for_timeout(400)
    check(len(page.query_selector_all('#chatLog .msg')) == 4, 'problem 1 conversation is still there')
    page.click('[data-close-tool]'); page.wait_for_timeout(300)
    # grade, then ask about a result
    page.evaluate("() => { const S = UI.app.SET.ibp; S.items[1].ans = '-(' + S.items[1].p.answer.ascii + ') + C'; S.stage = 'review'; UI.render(); }"); page.wait_for_timeout(200)
    page.click('[data-act="setGrade"]'); page.wait_for_timeout(500)
    page.click('[data-act="setView"][data-k="1"]'); page.wait_for_timeout(250)
    check(page.query_selector('[data-act="setAskRes"][data-k="1"]') is not None, 'graded problem has an Ask button')
    page.click('[data-act="setAskRes"][data-k="1"]'); page.wait_for_timeout(450)
    label = page.inner_text('#drawerBody .preview')
    check('problem 2' in label and 'graded' in label, f'drawer shows the graded problem ({label.strip()})')
    chips = [c.inner_text() for c in page.query_selector_all('#drawerBody .chips button')]
    check('Where exactly did I go wrong?' in chips, f'graded chips {chips}')
    check(len(page.query_selector_all('#chatLog .msg')) == 0, 'graded view starts its own conversation')
    page.click('#drawerBody .chips button >> nth=1'); page.wait_for_timeout(400)
    sent = page.evaluate("() => window.__calls[window.__calls.length - 1][0].content")
    check('has been graded' in sent and 'explain freely' in sent, 'Claude knows it was graded and can explain freely')
    check('Their typed answer: -(' in sent, 'Claude sees the graded answer')
    page.screenshot(path=f'{SHOTS}/31-ask-graded.png', full_page=False)
    page.click('[data-close-tool]'); page.wait_for_timeout(300)
    # step-by-step still has its question button
    page.click('[data-act="mode"][data-m="steps"]'); page.wait_for_timeout(300)
    idx = page.evaluate("() => UI.app.P.p.steps[0].check.options.findIndex(o => o.ok)")
    page.click(f'#step0 .opt[data-k="{idx}"]'); page.wait_for_timeout(250)
    check(page.query_selector('[data-act="askStep"]') is not None, 'step mode keeps "I have a question"')
    page.click('[data-act="askStep"]'); page.wait_for_timeout(400)
    chips = [c.inner_text() for c in page.query_selector_all('#drawerBody .chips button')]
    check('Explain this step simply' in chips, 'step chips in step mode')
    ctx.close(); b.close()
print('ERRORS', len(errors)); [print(e) for e in errors[:20]]
print('FAILS', len(fails)); [print(' -', f) for f in fails]
