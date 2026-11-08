"""Dibuja en vectores con volumen (vista 3/4, degradados y brillos) los productos sin foto
y los renderiza con fondo transparente para componerlos sobre el fondo real."""
import sys, pathlib
from playwright.sync_api import sync_playwright

out = pathlib.Path(sys.argv[1]); out.mkdir(parents=True, exist_ok=True)
LOGO = 'http://localhost:4173/assets/burgershot-logo.webp'

def box(kind):
    happy = kind == 'happy'
    front = ('#e8261f', '#b3110f') if happy else ('#2b4fa8', '#162d6b')
    side = ('#8f0c0f', '#5e0707') if happy else ('#13265a', '#0b1838')
    top = ('#f2402f', '#c8171b') if happy else ('#3a62c2', '#1f3a8a')
    handle = ('#ffd15a', '#e8920f') if happy else ('#f2f5f7', '#9fb0b6')
    badge = '' if happy else f'''
      <g transform="translate(262 318) skewY(5)">
        <circle r="44" fill="url(#gold)" stroke="#8a5a00" stroke-width="2"/>
        <path d="M0 -30 L8.8 -12 L28.5 -9.3 L14.3 4.6 L17.6 24.3 L0 15 L-17.6 24.3 L-14.3 4.6 L-28.5 -9.3 L-8.8 -12Z" fill="#1f3a8a"/>
        <circle r="7" fill="#ffd15a"/>
        <path d="M-30 -30 A42 42 0 0 1 20 -38" stroke="#fff" stroke-opacity=".7" stroke-width="3" fill="none" stroke-linecap="round"/>
      </g>'''
    logo = f'<image href="{LOGO}" x="200" y="262" width="124" height="110" transform="skewY(5) translate(0 -22)" preserveAspectRatio="xMidYMid meet"/>' if happy else \
           f'<image href="{LOGO}" x="222" y="206" width="78" height="68" transform="skewY(5) translate(0 -18)" preserveAspectRatio="xMidYMid meet"/>'
    smile = '<path d="M226 128 Q260 150 294 132" stroke="#7a3a00" stroke-width="7" fill="none" stroke-linecap="round"/><circle cx="232" cy="110" r="6" fill="#7a3a00"/><circle cx="288" cy="116" r="6" fill="#7a3a00"/>' if happy else ''
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" width="600" height="500">
    <defs>
      <linearGradient id="front" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{front[0]}"/><stop offset="1" stop-color="{front[1]}"/></linearGradient>
      <linearGradient id="side" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{side[0]}"/><stop offset="1" stop-color="{side[1]}"/></linearGradient>
      <linearGradient id="top" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="{top[0]}"/><stop offset="1" stop-color="{top[1]}"/></linearGradient>
      <linearGradient id="handle" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="{handle[0]}"/><stop offset="1" stop-color="{handle[1]}"/></linearGradient>
      <radialGradient id="gold" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#ffe39a"/><stop offset=".6" stop-color="#f2b026"/><stop offset="1" stop-color="#b87400"/></radialGradient>
      <linearGradient id="sheen" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <linearGradient id="shade" x1="0" y1="0" x2="0" y2="1"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".28"/></linearGradient>
      <clipPath id="fc"><path d="M140 240 L380 262 L380 470 L140 448Z"/></clipPath>
    </defs>
    <!-- Asa con ranura -->
    <path fill-rule="evenodd" d="M182 196 L176 96 Q176 70 204 72 L330 84 Q356 86 356 112 L350 214Z M210 112 Q206 98 222 99 L312 107 Q326 108 324 122 L322 134 Q320 146 306 145 L222 138 Q210 137 210 124Z" fill="url(#handle)"/>
    {smile}
    <path d="M176 96 Q176 70 204 72 L330 84" stroke="#fff" stroke-opacity=".55" stroke-width="3" fill="none" stroke-linecap="round"/>
    <!-- Tapas del techo a dos aguas -->
    <path d="M140 240 L380 262 L350 210 L182 194Z" fill="url(#top)"/>
    <path d="M380 262 L470 236 L432 190 L350 210Z" fill="url(#side)" opacity=".9"/>
    <path d="M182 194 L350 210" stroke="#fff" stroke-opacity=".35" stroke-width="2"/>
    <!-- Caras -->
    <path d="M380 262 L470 236 L470 436 L380 470Z" fill="url(#side)"/>
    <path d="M140 240 L380 262 L380 470 L140 448Z" fill="url(#front)"/>
    <g clip-path="url(#fc)">
      <path d="M140 400 L190 450 L170 450 L140 420Z M140 360 L230 452 L208 452 L140 382Z" fill="#fff4ec" opacity=".95"/>
      <path d="M380 404 L330 470 L350 470 L380 430Z M380 360 L292 470 L314 470 L380 386Z" fill="#fff4ec" opacity=".95"/>
      <rect x="140" y="240" width="240" height="230" fill="url(#sheen)"/>
      <rect x="140" y="240" width="240" height="230" fill="url(#shade)"/>
    </g>
    {logo}{badge}
    <path d="M140 240 L380 262 L470 236" stroke="#fff" stroke-opacity=".45" stroke-width="2" fill="none"/>
    <path d="M380 262 V470" stroke="#000" stroke-opacity=".25" stroke-width="2"/>
    </svg>'''

def sundae():
    drips = 'M186 252 Q200 232 222 240 Q236 246 240 262 Q246 280 254 262 Q262 236 300 234 Q338 236 346 262 Q352 286 362 262 Q370 240 392 244 Q414 250 414 268 Q400 230 300 214 Q200 216 186 252Z'
    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 600 500" width="600" height="500">
    <defs>
      <linearGradient id="cup" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#8c0b0b"/><stop offset=".3" stop-color="#e8261f"/><stop offset=".55" stop-color="#d81b18"/><stop offset="1" stop-color="#6e0808"/></linearGradient>
      <radialGradient id="cream" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="#fffdf7"/><stop offset=".6" stop-color="#f7e9d6"/><stop offset="1" stop-color="#d9bf9d"/></radialGradient>
      <linearGradient id="choc" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a3a18"/><stop offset="1" stop-color="#3b1406"/></linearGradient>
      <radialGradient id="cherry" cx=".35" cy=".3" r=".75"><stop offset="0" stop-color="#ff8a80"/><stop offset=".45" stop-color="#e01c22"/><stop offset="1" stop-color="#6e0508"/></radialGradient>
      <linearGradient id="cupshade" x1="0" y1="0" x2="0" y2="1"><stop offset=".5" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".3"/></linearGradient>
      <clipPath id="cc"><path d="M176 300 L216 462 Q300 482 384 462 L424 300Z"/></clipPath>
    </defs>
    <!-- Crema en espiral -->
    <path d="M176 300 Q160 262 206 252 Q244 228 300 230 Q358 228 394 252 Q440 262 424 300Z" fill="url(#cream)"/>
    <path d="M206 254 Q192 214 236 204 Q262 186 300 188 Q340 186 364 204 Q408 214 394 254Z" fill="url(#cream)"/>
    <path d="M238 206 Q232 172 262 164 Q280 148 300 150 Q322 148 338 164 Q368 172 362 206Z" fill="url(#cream)"/>
    <path d="M268 166 Q270 132 300 120 Q318 112 314 98 Q336 116 330 140 Q326 160 332 166Z" fill="url(#cream)"/>
    <path d="M206 254 Q300 272 394 254 M238 206 Q300 222 362 206 M268 166 Q300 178 332 166" stroke="#c9a77f" stroke-width="3" fill="none" opacity=".7"/>
    <!-- Chocolate -->
    <path d="{drips}" fill="url(#choc)"/>
    <path d="M220 236 Q260 222 300 222" stroke="#fff" stroke-opacity=".5" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M250 182 Q262 168 290 166 Q300 190 312 168 Q340 168 352 184 Q330 158 300 156 Q264 158 250 182Z" fill="url(#choc)"/>
    <!-- Cereza -->
    <path d="M304 102 Q312 70 334 56" stroke="#5a3a12" stroke-width="4" fill="none" stroke-linecap="round"/>
    <circle cx="300" cy="104" r="22" fill="url(#cherry)"/>
    <ellipse cx="292" cy="96" rx="6" ry="4" fill="#fff" opacity=".8"/>
    <!-- Vaso Burger Shot -->
    <path d="M176 300 L216 462 Q300 482 384 462 L424 300Z" fill="url(#cup)"/>
    <g clip-path="url(#cc)">
      <path d="M176 410 L236 470 L214 470 L176 432Z M176 370 L272 470 L250 470 L176 392Z" fill="#fff4ec"/>
      <path d="M424 410 L364 470 L386 470 L424 432Z M424 370 L328 470 L350 470 L424 392Z" fill="#fff4ec"/>
      <rect x="170" y="300" width="260" height="180" fill="url(#cupshade)"/>
      <path d="M214 300 L236 470" stroke="#fff" stroke-opacity=".3" stroke-width="10"/>
    </g>
    <image href="{LOGO}" x="242" y="318" width="116" height="100" preserveAspectRatio="xMidYMid meet"/>
    <path d="M172 298 Q300 314 428 298 L424 308 Q300 324 176 308Z" fill="#f2302a"/>
    <path d="M176 300 Q300 316 424 300" stroke="#fff" stroke-opacity=".5" stroke-width="2" fill="none"/>
    </svg>'''

items = {'happybox': box('happy'), 'happybox-police': box('police'), 'icecream': sundae()}
with sync_playwright() as p:
    try: b = p.chromium.launch()
    except Exception: b = p.chromium.launch(channel='msedge')
    pg = b.new_context(viewport={'width': 600, 'height': 500}, device_scale_factor=2).new_page()
    for k, svg in items.items():
        pg.set_content(f'<html><body style="margin:0;background:transparent">{svg}</body></html>')
        pg.wait_for_timeout(500)
        pg.screenshot(path=str(out / f'{k}.png'), omit_background=True, clip={'x': 0, 'y': 0, 'width': 600, 'height': 500})
        (out / f'{k}.svg').write_text(svg, encoding='utf-8')
    b.close()
print('ok')
