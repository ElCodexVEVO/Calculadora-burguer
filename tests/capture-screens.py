"""Capturas de referencia de Burger Shot con datos simulados.

Uso (desde la raíz del proyecto, con un servidor estático en el puerto 8000):
    py tests/capture-screens.py <prefijo> [carpeta]

Abre DEMO_ACCESO.html y DEMO_V6.html; nunca contacta con Supabase real.
"""
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

PREFIX = sys.argv[1] if len(sys.argv) > 1 else "captura"
OUT = Path(sys.argv[2] if len(sys.argv) > 2 else "preview/v7")
OUT.mkdir(parents=True, exist_ok=True)
BASE = "http://127.0.0.1:8000"
WIDTHS = {"movil": (390, 844), "tableta": (768, 1024), "escritorio": (1440, 960)}
EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"


def shot(page, name):
    page.wait_for_timeout(900)
    page.screenshot(path=str(OUT / f"{PREFIX}-{name}.jpg"), type="jpeg", quality=78)


with sync_playwright() as p:
    # WebGL por software: permite capturar también la escena 3D de la insignia de temporada.
    browser = p.chromium.launch(headless=True, executable_path=EDGE, args=["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    errors = []
    for label, (w, h) in WIDTHS.items():
        ctx = browser.new_context(viewport={"width": w, "height": h}, device_scale_factor=1)
        page = ctx.new_page()
        page.on("pageerror", lambda e, l=label: errors.append(f"{l}: {e}"))
        page.on("dialog", lambda d: d.accept())
        page.goto(f"{BASE}/DEMO_ACCESO.html")
        page.wait_for_load_state("networkidle")
        page.locator("#authScreen").wait_for(state="visible")
        shot(page, f"acceso-{label}")

        page.goto(f"{BASE}/DEMO_V6.html")
        page.wait_for_load_state("networkidle")
        page.locator("#app").wait_for(state="visible")
        page.wait_for_timeout(1200)
        shot(page, f"inicio-{label}")

        if w < 900:
            page.locator("#mobileMenu").click()
            page.wait_for_timeout(400)
            shot(page, f"menu-{label}")
            page.keyboard.press("Escape")
            page.evaluate("document.querySelector('[data-page=\"pos\"]').click()")
        else:
            page.locator('.nav-item[data-page="pos"]').click()
        page.wait_for_timeout(500)
        page.evaluate("""() => {
            const add = id => document.querySelector(`[data-add="${id}"]`)?.click();
            add('p0'); add('p0'); add('p8'); add('p10');
        }""")
        shot(page, f"caja-{label}")
        page.evaluate("document.querySelector('.order-panel')?.scrollIntoView({block:'start'})")
        shot(page, f"pedido-{label}")

        for target in ("mySales", "analytics"):
            page.evaluate(f"document.querySelector('[data-page=\"{target}\"]').click()")
            page.wait_for_timeout(500)
            page.evaluate("window.scrollTo(0,0)")
            shot(page, f"{target}-{label}")
        ctx.close()
    browser.close()
    print("errores de página:", errors or "ninguno")
