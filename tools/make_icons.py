# Draws the home-screen icons (the app's integral-sign mark) into assets/icons/. Run once: python3 tools/make_icons.py
import os
from playwright.sync_api import sync_playwright
OUT = os.path.join(os.path.dirname(__file__), '..', 'assets', 'icons')
PATH = 'M16.5 3.6c-1.1-1.3-4.4-1.2-4.6 2.6l-.1 11.6c-.2 3.8-3.5 3.9-4.6 2.6'
def svg(scale):
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="100%" height="100%">
  <rect width="512" height="512" fill="#1d1930"/>
  <g transform="translate(256 256) scale({scale}) translate(-11.85 -12)" fill="none" stroke-linecap="round" stroke-linejoin="round">
    <path d="{PATH}" stroke="#e23d7d" stroke-width="2.7" transform="translate(1 1)"/>
    <path d="{PATH}" stroke="#ffffff" stroke-width="2.7"/>
  </g></svg>'''
ICONS = [('icon-192.png', 192, 15.5), ('icon-512.png', 512, 15.5), ('apple-touch-icon.png', 180, 15.5), ('icon-maskable-512.png', 512, 11.5)]
with sync_playwright() as p:
    b = p.chromium.launch()
    for name, size, scale in ICONS:
        page = b.new_page(viewport={'width': size, 'height': size})
        page.set_content(f'<html><body style="margin:0;width:{size}px;height:{size}px">{svg(scale)}</body></html>')
        page.screenshot(path=os.path.join(OUT, name), clip={'x': 0, 'y': 0, 'width': size, 'height': size})
        page.close()
    b.close()
print('icons written to', os.path.abspath(OUT))
