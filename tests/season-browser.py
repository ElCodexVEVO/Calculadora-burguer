"""Burger Shot · pruebas de la insignia de temporada con escena 3D (Webapp Testing, Playwright para Python).

Uso desde la raíz del proyecto:  py tests/season-browser.py
Opcional: CHROMIUM_EXECUTABLE (por defecto, Microsoft Edge).
Usa la demo con datos simulados; no contacta con Supabase. Resultado: tests/season-browser-results.json
"""
import json
import mimetypes
import os
import sys
from datetime import datetime
from pathlib import Path
from playwright.sync_api import sync_playwright

# La consola de Windows no siempre es UTF-8: los mensajes llevan acentos y símbolos.
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
EXE = os.environ.get("CHROMIUM_EXECUTABLE", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe")
BASE = "http://burgershot.test/"
TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
         ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png", ".glb": "model/gltf-binary"}
TEXTS = ["Burger Shot", "Día de Muertos", "y Halloween", "Edición de temporada"]
results, notes, errors = [], [], []


def ok(name):
    results.append(name)
    print("PASS", name)


def check(cond, msg):
    if not cond:
        raise AssertionError(msg)


def page_for(browser, width=1440, height=900, reduced=False, mobile=False, block=(), init=None):
    ctx = browser.new_context(viewport={"width": width, "height": height}, reduced_motion="reduce" if reduced else "no-preference",
                              has_touch=mobile, is_mobile=mobile, device_scale_factor=2)
    page = ctx.new_page()
    requested = []

    def route(r):
        url = r.request.url
        if not url.startswith(BASE):
            return r.abort()
        rel = url[len(BASE):].split("?")[0] or "index.html"
        requested.append(rel)
        if any(rel.startswith(b) for b in block):
            return r.fulfill(status=404, body="bloqueado en la prueba")
        file = (ROOT / rel).resolve()
        if ROOT not in file.parents or not file.exists():
            return r.fulfill(status=404, body="Not found")
        return r.fulfill(body=file.read_bytes(), content_type=TYPES.get(file.suffix, mimetypes.guess_type(str(file))[0] or "application/octet-stream"))

    page.route("**/*", route)
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("dialog", lambda d: d.accept())
    page.add_init_script("window.__cls=0;new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__cls+=e.value}).observe({type:'layout-shift',buffered:true});")
    if init:
        page.add_init_script(init)
    page.goto(BASE + "DEMO_V6.html", wait_until="domcontentloaded")
    page.locator("#app").wait_for(state="visible")
    return ctx, page, requested


CARD = """(()=>{const c=document.querySelector('.season-card'),art=c.querySelector('.season-card-art'),copy=c.querySelector('.season-card-copy'),img=art.querySelector('img');
  const box=e=>{const r=e.getBoundingClientRect();return {x:r.left,y:r.top,w:r.width,h:r.height,r:r.right,b:r.bottom}};
  const ink=e=>{const g=document.createRange();g.selectNodeContents(e);const r=g.getBoundingClientRect();return {x:r.left,r:r.right,y:r.top,b:r.bottom}};
  const lines=[copy.querySelector('span'),copy.querySelector('strong'),copy.querySelector('em'),copy.querySelector('small')];
  return {card:box(c),art:box(art),copy:box(copy),ink:lines.map(ink),
    texts:[lines[0].textContent.trim(),lines[1].childNodes[0].textContent.trim(),lines[2].textContent.trim(),lines[3].textContent.trim()],
    img:{ok:img.complete&&img.naturalWidth>0,nat:[img.naturalWidth,img.naturalHeight],opacity:getComputedStyle(img).opacity},
    canvases:art.querySelectorAll('canvas').length,is3d:art.classList.contains('is-3d'),
    canvasOpacity:art.querySelector('canvas')?getComputedStyle(art.querySelector('canvas')).opacity:null,
    canvasEvents:art.querySelector('canvas')?getComputedStyle(art.querySelector('canvas')).pointerEvents:null,
    hidden:c.getAttribute('aria-hidden'),border:getComputedStyle(c).borderTopColor,bg:getComputedStyle(c).backgroundColor,
    corner:getComputedStyle(c,'::after').backgroundImage,cornerEvents:getComputedStyle(c,'::after').pointerEvents}})()"""


def layout_checks(d, max_width, label):
    check(d["texts"] == TEXTS, f"{label}: los cuatro textos siguen en HTML: {d['texts']}")
    check(d["card"]["w"] <= max_width and d["card"]["h"] <= 116, f"{label}: bloque compacto: {d['card']}")
    inner_right = d["card"]["r"] - 1
    for text, ink in zip(TEXTS, d["ink"]):
        check(ink["r"] <= inner_right + 0.5 and ink["x"] >= d["art"]["r"] - 0.5, f"{label}: «{text}» sin cortes ni solapes: {ink} arte={d['art']} tarjeta={d['card']}")
    check(d["art"]["x"] >= d["card"]["x"] and d["art"]["y"] >= d["card"]["y"] and d["art"]["b"] <= d["card"]["b"], f"{label}: la ilustración no se sale: {d['art']}")
    check("papel-esquina.svg" in d["corner"] and d["cornerEvents"] == "none", f"{label}: papel picado como recurso propio: {d['corner']}")
    check(d["hidden"] == "true", f"{label}: decorativa para lectores de pantalla")


with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path=EXE, args=["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
    try:
        # ── Escritorio: carga diferida, escena en marcha, medidas y textos ──
        ctx, page, requested = page_for(browser)
        page.wait_for_selector(".season-card-art.is-3d", timeout=20000)
        # El respaldo se funde hacia la escena: se espera al final del fundido en lugar de un tiempo fijo.
        page.wait_for_function("parseFloat(getComputedStyle(document.querySelector('.season-card-art img')).opacity)<0.01&&getComputedStyle(document.querySelector('.season-card-canvas')).opacity==='1'", timeout=6000)
        page.wait_for_function("document.querySelector('.season-card').getAnimations().every(a=>a.playState!=='running')", timeout=6000)
        d = page.evaluate(CARD)
        layout_checks(d, 212, "Escritorio")
        check(d["img"]["ok"] and d["img"]["nat"] == [396, 330], f"La imagen de respaldo existe y carga: {d['img']}")
        ok("Escritorio 1440: bloque compacto, cuatro textos en HTML, sin cortes ni solapes")
        check(d["is3d"] and d["canvases"] == 1 and d["canvasOpacity"] == "1" and float(d["img"]["opacity"]) < 0.01, f"Escena 3D visible sobre el respaldo: {d}")
        check(d["canvasEvents"] == "none", "El lienzo no intercepta clics")
        scene = page.evaluate("({running:BurgerShotSeasonScene.isRunning(),tris:BurgerShotSeasonScene.triangles})")
        check(scene["running"] and 0 < scene["tris"] < 12000, f"Escena en marcha y ligera: {scene}")
        check("season-scene.js" in requested and "assets/season/escena-temporada.glb" in requested, "La escena se pide de forma diferida")
        html = (ROOT / "index.html").read_text(encoding="utf-8")
        check("season-scene.js" not in html and "three.module" not in html.split("importmap")[1].split("</script>")[1], "Three.js no se carga con la página, solo bajo demanda")
        notes.append(f"Escena: {scene['tris']} triángulos; tarjeta {d['card']['w']:.0f}×{d['card']['h']:.0f} px; ilustración {d['art']['w']:.0f}×{d['art']['h']:.0f} px")
        ok("Escena 3D: un solo lienzo, en marcha, cargada bajo demanda")

        # ── Llama: la luz varía de forma irregular ──
        samples = []
        for _ in range(12):
            samples.append(page.evaluate("BurgerShotSeasonScene.state().light"))
            page.wait_for_timeout(70)
        spread = (max(samples) - min(samples)) / (sum(samples) / len(samples))
        check(0.04 < spread < 0.6, f"La luz de la llama oscila con suavidad: {spread:.3f} {samples}")
        # Con el resplandor CSS detenido, lo único que puede cambiar en la ilustración es el lienzo 3D.
        freeze = page.add_style_tag(content=".season-card-art::before{animation:none!important}")
        frames = []
        for _ in range(4):
            frames.append(page.locator(".season-card-art").screenshot())
            page.wait_for_timeout(160)
        freeze.evaluate("e=>e.remove()")
        check(len(set(frames)) > 1, "La llama cambia de un fotograma a otro en pantalla")
        notes.append(f"Oscilación de la luz: {spread * 100:.0f} % alrededor de la media; {len(set(frames))} de 4 capturas de la llama son distintas")
        ok("Llama y luz animadas con variación irregular")

        # ── Perspectiva con el cursor, amortiguada y con tope ──
        box = page.locator(".season-card").bounding_box()
        page.mouse.move(box["x"] + box["width"] / 2 + 600, box["y"] + 20)
        page.wait_for_timeout(1400)
        right = page.evaluate("BurgerShotSeasonScene.state()")
        page.mouse.move(2, 300)
        page.wait_for_timeout(1400)
        left = page.evaluate("BurgerShotSeasonScene.state()")
        check(0.05 < right["tiltY"] <= 0.171, f"Gira hacia el cursor a la derecha, con tope: {right}")
        check(left["tiltY"] < right["tiltY"] - 0.03 and abs(left["tiltX"]) <= 0.071, f"Sigue al cursor sin pasarse: {left}")
        notes.append(f"Perspectiva: giro máximo {max(abs(right['tiltY']), abs(left['tiltY'])) * 57.3:.1f}° horizontal, {max(abs(right['tiltX']), abs(left['tiltX'])) * 57.3:.1f}° vertical")
        ok("Perspectiva: variación pequeña y amortiguada al mover el cursor")

        # ── Al pasar el cursor: más luz, texto estable ──
        before = page.evaluate(CARD)
        page.locator(".season-card").hover()
        page.wait_for_function("BurgerShotSeasonScene.state().boost>1.25", timeout=4000)
        page.wait_for_timeout(300)
        hover = page.evaluate(CARD)
        check(hover["border"] != before["border"], f"El borde responde al cursor: {before['border']} → {hover['border']}")
        check([i["x"] for i in hover["ink"]] == [i["x"] for i in before["ink"]] and hover["card"] == before["card"], "El texto no se mueve al pasar el cursor")
        page.mouse.move(700, 500)
        page.wait_for_function("BurgerShotSeasonScene.state().boost<1.08", timeout=4000)
        ok("Al pasar el cursor sube la luz de la llama y el texto queda quieto")

        # ── Pausa cuando no se ve y con las animaciones apagadas ──
        page.evaluate("document.querySelector('.season-card').style.display='none'")
        page.wait_for_function("!BurgerShotSeasonScene.isRunning()", timeout=4000)
        page.evaluate("document.querySelector('.season-card').style.display=''")
        page.wait_for_function("BurgerShotSeasonScene.isRunning()", timeout=4000)
        page.evaluate("document.body.classList.add('motion-off')")
        page.wait_for_function("!BurgerShotSeasonScene.isRunning()", timeout=4000)
        quiet = page.evaluate("document.querySelector('.season-card').getAnimations({subtree:true}).filter(a=>a.playState==='running').length")
        check(quiet == 0, f"Con las animaciones apagadas no queda nada en marcha: {quiet}")
        page.evaluate("document.body.classList.remove('motion-off')")
        page.wait_for_function("BurgerShotSeasonScene.isRunning()", timeout=4000)
        cls = page.evaluate("window.__cls")
        check(cls < 0.02, f"Sin desplazamientos de diseño: {cls}")
        notes.append(f"CLS en escritorio con la escena: {cls:.4f}")
        ok("Se pausa cuando no es visible o se apagan las animaciones y se reanuda después")
        ctx.close()

        # ── Movimiento reducido: imagen fija, sin 3D ni animaciones ──
        ctx, page, requested = page_for(browser, reduced=True)
        page.wait_for_timeout(1800)
        d = page.evaluate(CARD)
        layout_checks(d, 212, "Movimiento reducido")
        check(not d["is3d"] and d["canvases"] == 0 and d["img"]["ok"] and d["img"]["opacity"] == "1", f"Queda la imagen estática: {d}")
        check("season-scene.js" not in requested and not any("three" in r for r in requested), "No se descarga Three.js con movimiento reducido")
        running = page.evaluate("document.querySelector('.season-card').getAnimations({subtree:true}).filter(a=>a.playState==='running').length")
        check(running == 0, f"Sin animaciones con movimiento reducido: {running}")
        ok("Movimiento reducido: imagen estática, sin 3D ni animaciones")
        ctx.close()

        # ── Respaldo: sin modelo, sin Three.js o sin WebGL queda la imagen ──
        for label, kwargs in (("sin el modelo .glb", {"block": ("assets/season/escena-temporada.glb",)}),
                              ("sin Three.js", {"block": ("assets/vendor/three/",)}),
                              ("sin WebGL", {"init": "const g=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(t,...a){return /webgl/i.test(t)?null:g.call(this,t,...a)};"})):
            ctx, page, requested = page_for(browser, **kwargs)
            page.wait_for_timeout(2600)
            d = page.evaluate(CARD)
            check(not d["is3d"] and d["canvases"] == 0, f"Respaldo {label}: no queda lienzo vacío: {d}")
            check(d["img"]["ok"] and d["img"]["opacity"] == "1", f"Respaldo {label}: se ve la imagen estática: {d['img']}")
            layout_checks(d, 212, f"Respaldo {label}")
            ctx.close()
        ok("Respaldo: imagen estática si falla el modelo, Three.js o WebGL")

        # ── Móvil: dentro del menú lateral ──
        ctx, page, requested = page_for(browser, width=390, height=844, mobile=True)
        page.wait_for_timeout(700)
        check("season-scene.js" not in requested, "En móvil no se pide la escena con el menú cerrado")
        page.locator("#mobileMenu").tap()
        page.wait_for_timeout(700)
        d = page.evaluate(CARD)
        layout_checks(d, 264, "Móvil")
        check(d["card"]["x"] >= 0 and d["card"]["r"] <= 264, f"Móvil: la tarjeta cabe en el menú: {d['card']}")
        check(d["img"]["ok"], "Móvil: la imagen de respaldo carga")
        try:
            page.wait_for_selector(".season-card-art.is-3d", timeout=12000)
            page.wait_for_function("BurgerShotSeasonScene.isRunning()", timeout=4000)
            page.keyboard.press("Escape")
            page.wait_for_function("!BurgerShotSeasonScene.isRunning()", timeout=5000)
            notes.append("Móvil: la escena se carga al abrir el menú y se pausa al cerrarlo")
        except Exception as error:  # noqa: BLE001
            raise AssertionError(f"Móvil: la escena debe cargarse al abrir el menú y pausarse al cerrarlo: {error}")
        ok("Móvil 390: la insignia cabe en el menú, carga al abrirlo y se pausa al cerrarlo")
        ctx.close()
    finally:
        browser.close()

check(not errors, f"Errores de JavaScript: {errors[:5]}")
ok("Sin errores de JavaScript")
out = {"date": datetime.now().isoformat(timespec="seconds"), "browser": "Microsoft Edge (Chromium) headless, WebGL por software", "passed": results, "notes": notes}
(ROOT / "tests" / "season-browser-results.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"\n{len(results)} escenarios superados.")
