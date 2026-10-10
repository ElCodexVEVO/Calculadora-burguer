"""Burger Shot · pruebas del sistema de logo (Webapp Testing, Playwright para Python).

Uso desde la raíz del proyecto:  py tests/logo-browser.py
Opcional: CHROMIUM_EXECUTABLE (por defecto, Microsoft Edge) y LOGO_SERVER (servidor estático
para la prueba de conexión lenta; por defecto http://127.0.0.1:8000, se omite si no responde).
Usa las demos con datos simulados; no contacta con Supabase. Resultado: tests/logo-browser-results.json
"""
import json
import mimetypes
import os
import sys
import urllib.request
from datetime import datetime
from pathlib import Path
from playwright.sync_api import sync_playwright

# La consola de Windows no siempre es UTF-8: los mensajes llevan acentos y símbolos.
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = Path(__file__).resolve().parent.parent
EXE = os.environ.get("CHROMIUM_EXECUTABLE", "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe")
SERVER = os.environ.get("LOGO_SERVER", "http://127.0.0.1:8000")
BASE = "http://burgershot.test/"
TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
         ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png"}
results, notes, errors = [], [], []


def ok(name):
    results.append(name)
    print("PASS", name)


def check(cond, msg):
    if not cond:
        raise AssertionError(msg)


def page_for(browser, entry, width=1440, height=900, reduced=False, mobile=False, block=None):
    ctx = browser.new_context(viewport={"width": width, "height": height}, reduced_motion="reduce" if reduced else "no-preference",
                              has_touch=mobile, is_mobile=mobile)
    page = ctx.new_page()

    def route(r):
        url = r.request.url
        if not url.startswith(BASE):
            return r.abort()
        rel = url[len(BASE):].split("?")[0] or "index.html"
        if block and any(rel.startswith(b) for b in block):
            return r.fulfill(status=404, body="bloqueado en la prueba")
        file = (ROOT / rel).resolve()
        if ROOT not in file.parents or not file.exists():
            return r.fulfill(status=404, body="Not found")
        return r.fulfill(body=file.read_bytes(), content_type=TYPES.get(file.suffix, mimetypes.guess_type(str(file))[0] or "application/octet-stream"))

    page.route("**/*", route)
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.on("dialog", lambda d: d.accept())
    page.add_init_script("""
      window.__cls=0;new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__cls+=e.value}).observe({type:'layout-shift',buffered:true});
      // Registro de las animaciones lanzadas por código: permite comprobarlas aunque ya hayan terminado.
      window.__anims=[];const animate=Element.prototype.animate;
      Element.prototype.animate=function(k,o){try{if(window.__anims.length<300)window.__anims.push({tag:this.tagName,top:!!this.closest('.topbar'),k:Array.isArray(k)?k.map(x=>x.transform||''):[],d:typeof o==='number'?o:o&&o.duration})}catch(e){}return animate.call(this,k,o)};
    """)
    page.goto(BASE + entry, wait_until="domcontentloaded")
    return ctx, page


with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path=EXE, args=["--js-flags=--expose-gc"])
    try:
        # ── Primera carga del acceso: entrada completa, duración, FPS y estabilidad ──
        ctx, page = page_for(browser, "DEMO_ACCESO.html")
        page.wait_for_function("document.querySelector('#authScreen burgershot-logo')?.classList.contains('is-intro')", timeout=8000)
        timing = page.evaluate("""(async()=>{
          const logo=document.querySelector('#authScreen burgershot-logo');
          const anims=document.getAnimations().filter(a=>logo.contains(a.effect?.target)||a.effect?.target===logo);
          const end=Math.max(...anims.map(a=>{const t=a.effect.getComputedTiming();return t.endTime}));
          const veil=!!document.querySelector('.gate.is-logo-intro');
          let frames=0,start=performance.now();await new Promise(r=>{const f=()=>{frames++;performance.now()-start<1000?requestAnimationFrame(f):r()};requestAnimationFrame(f)});
          return {count:anims.length,end,fps:frames,veil}})()""")
        check(timing["count"] >= 8, f"La entrada completa debe animar varias capas: {timing}")
        check(900 <= timing["end"] <= 1400, f"Duración de la entrada fuera de 900–1400 ms: {timing['end']}")
        check(timing["veil"], "Fondo ligeramente oscuro al inicio de la entrada")
        page.wait_for_function("!document.querySelector('#authScreen burgershot-logo').classList.contains('is-intro')", timeout=3000)
        # Los FPS se comparan con el ritmo del propio equipo en reposo, medido justo después:
        # así la prueba mide el coste de la entrada y no la carga de la máquina en ese momento.
        page.wait_for_timeout(400)
        idle = page.evaluate("""(async()=>{let frames=0,start=performance.now();await new Promise(r=>{const f=()=>{frames++;performance.now()-start<1000?requestAnimationFrame(f):r()};requestAnimationFrame(f)});return frames})()""")
        if idle >= 30:
            check(timing["fps"] >= min(50, idle * 0.7), f"FPS durante la entrada: {timing['fps']} (en reposo: {idle})")
        check(page.locator("#loginBtn").is_enabled() and page.locator("#loginUsername").is_editable(), "Formulario usable tras la entrada")
        stable = page.evaluate("""(()=>{const m=document.querySelector('#authScreen .bs-mark');const t=new DOMMatrix(getComputedStyle(m).transform);
          return {running:m.getAnimations().filter(a=>a.playState==='running').length,rot:[t.m11,t.m22,t.m33,t.m13,t.m23].map(v=>+v.toFixed(4))}})()""")
        check(stable["running"] == 0 and stable["rot"] == [1, 1, 1, 0, 0], f"El logo queda quieto (sin giro ni animación): {stable}")
        cls = page.evaluate("window.__cls")
        check(cls < 0.02, f"Desplazamiento acumulado de maquetación en el acceso: {cls}")
        check(page.evaluate("[...document.querySelectorAll('canvas')].filter(c=>c.id!=='bsCanvas'&&!c.classList.contains('season-card-canvas')).length+document.querySelectorAll('burgershot-logo canvas').length+Math.max(0,document.querySelectorAll('.season-card-canvas').length-1)") == 0, "Sin canvas del logo (solo el canvas 2D previo del OCR)")
        notes.append(f"Entrada completa: {timing['count']} animaciones, {timing['end']:.0f} ms, {timing['fps']} fps (en reposo, {idle} fps en la misma página); CLS acceso {cls:.4f}")
        if idle < 50:
            notes.append(f"Equipo cargado durante la prueba ({idle} fps en reposo): los 60 fps de la entrada no se pudieron confirmar en esta ejecución" + ("" if idle >= 30 else "; medición de FPS omitida"))
        ok(f"Entrada completa del acceso en {timing['end']:.0f} ms a {timing['fps']} fps, sin saltos ni canvas")
        # Escalonado: título a los 120 ms y formulario a los 220 ms.
        delays = page.evaluate("[...document.getAnimations()].filter(a=>a.animationName==='authReveal'||a.animationName==='authCard').map(a=>[a.effect.target.className||a.effect.target.tagName,a.effect.getTiming().delay])")
        check(any(d == 120 for _, d in delays) and any(d == 220 for _, d in delays), f"Escalonado del acceso: {delays}")
        ok("Acceso por etapas: logo → título (120 ms) → formulario (220 ms)")

        # ── Recarga en la misma sesión: entrada breve ──
        page.reload(wait_until="domcontentloaded")
        page.wait_for_function("document.querySelector('#authScreen burgershot-logo')?.classList.contains('is-intro')", timeout=8000)
        quick = page.evaluate("""(()=>{const logo=document.querySelector('#authScreen burgershot-logo');
          const a=document.getAnimations().filter(a=>logo.contains(a.effect?.target));return {n:a.length,end:Math.max(...a.map(x=>x.effect.getComputedTiming().endTime)),veil:!!document.querySelector('.gate.is-logo-intro')}})()""")
        check(quick["end"] <= 420 and not quick["veil"], f"Segunda vista en la sesión debe ser breve: {quick}")
        ok(f"Recarga en la misma sesión: entrada breve de {quick['end']:.0f} ms (no repite la completa)")

        # ── Paralaje por proximidad con amortiguación ──
        page.wait_for_timeout(500)
        box = page.locator("#authScreen .bs-mark").bounding_box()
        cx, cy = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
        page.mouse.move(cx + 400, cy + 400)
        page.mouse.move(cx + 60, cy - 40, steps=6)
        page.wait_for_timeout(450)
        tilt = page.evaluate("(()=>{const s=document.querySelector('#authScreen .bs-mark').style;return [parseFloat(s.getPropertyValue('--tilt-x')),parseFloat(s.getPropertyValue('--tilt-y'))]})()")
        check(any(abs(t) > 0.05 for t in tilt) and all(abs(t) <= 2.5 for t in tilt), f"Inclinación cerca del cursor (≤2,5°): {tilt}")
        page.mouse.move(cx + 900, cy + 500, steps=4)
        page.wait_for_timeout(900)
        rest = page.evaluate("(()=>{const s=document.querySelector('#authScreen .bs-mark').style;return [parseFloat(s.getPropertyValue('--tilt-x')||0),parseFloat(s.getPropertyValue('--tilt-y')||0)]})()")
        check(all(abs(t) < 0.02 for t in rest), f"Vuelve a reposo lejos del cursor: {rest}")
        loop = page.evaluate("document.querySelector('#authScreen burgershot-logo')._raf")
        check(not loop, "El bucle de paralaje se detiene en reposo")
        ok(f"Paralaje: inclinación {max(abs(t) for t in tilt):.2f}° cerca del logo, vuelve a 0 y el bucle se detiene")
        ctx.close()

        # ── Inicio: cabecera discreta, brillo al pasar y pulsación ──
        ctx, page = page_for(browser, "DEMO_V6.html")
        page.locator("#app").wait_for(state="visible")
        head = page.evaluate("window.__anims.filter(a=>a.tag==='BURGERSHOT-LOGO'&&a.top).map(a=>({d:a.d,k:a.k}))")
        check(head and 300 <= head[0]["d"] <= 400 and "translateY(-4px)" in (head[0]["k"][0] or ""), f"Entrada de cabecera 300–400 ms y −4 px: {head}")
        page.wait_for_timeout(600)
        page.locator(".topbar burgershot-logo .bs-mark").hover()
        page.wait_for_timeout(80)
        sweeping = page.evaluate("document.querySelector('.topbar .bs-mark-sheen').getAnimations().length")
        check(sweeping >= 1, "Reflejo al pasar el cursor")
        # El estado :hover puede tardar un fotograma en aplicarse: se espera en lugar de medir al instante.
        try:
            page.wait_for_function("getComputedStyle(document.querySelector('.topbar .bs-mark')).getPropertyValue('--scale').trim()==='1.015'", timeout=3000)
        except Exception:  # noqa: BLE001
            lifted = page.evaluate("getComputedStyle(document.querySelector('.topbar .bs-mark')).getPropertyValue('--scale').trim()")
            raise AssertionError(f"Escala al pasar: {lifted}")
        page.mouse.down()
        page.wait_for_timeout(120)
        pressed = page.evaluate("getComputedStyle(document.querySelector('.topbar .bs-mark')).getPropertyValue('--scale').trim()")
        page.mouse.up()
        check(pressed == ".98" or pressed == "0.98", f"Escala al pulsar: {pressed}")
        ok("Cabecera: entrada de 360 ms, reflejo y escala 1,015 al pasar, 0,98 al pulsar")
        cls_home = page.evaluate("window.__cls")
        check(cls_home < 0.05, f"CLS del inicio: {cls_home}")
        # Navegación repetida: sin duplicados ni crecimiento de memoria.
        # Antes se espera a que la insignia 3D termine de cargar (o caiga a su imagen de respaldo) para no contar Three.js como fuga.
        try:
            page.wait_for_selector(".season-card-art[data-scene]", timeout=8000, state="attached")
        except Exception:  # noqa: BLE001
            pass
        page.wait_for_timeout(300)
        count0 = page.evaluate("document.querySelectorAll('burgershot-logo').length")
        page.evaluate("window.gc&&gc()")
        heap0 = page.evaluate("performance.memory?.usedJSHeapSize||0")
        for i in range(30):
            page.evaluate(f"document.querySelector('[data-page=\"{['pos','dashboard','mySales','loyalty','companion'][i % 5]}\"]').click()")
        page.wait_for_timeout(400)
        page.evaluate("window.gc&&gc()")
        heap1 = page.evaluate("performance.memory?.usedJSHeapSize||0")
        count1 = page.evaluate("document.querySelectorAll('burgershot-logo').length")
        check(count1 == count0, f"Logos duplicados tras navegar: {count0} → {count1}")
        growth = (heap1 - heap0) / 1048576
        check(growth < 3, f"Crecimiento de memoria tras 30 navegaciones: {growth:.2f} MB")
        check(page.evaluate("[...document.querySelectorAll('canvas')].filter(c=>c.id!=='bsCanvas'&&!c.classList.contains('season-card-canvas')).length+document.querySelectorAll('burgershot-logo canvas').length+Math.max(0,document.querySelectorAll('.season-card-canvas').length-1)") == 0, "Sin canvas nuevos tras navegar (solo el OCR previo y, como mucho, uno de la insignia 3D)")
        notes.append(f"Navegación ×30: {count1} logos estables, memoria {growth:+.2f} MB; CLS inicio {cls_home:.4f}")
        ok(f"30 navegaciones: {count1} logos sin duplicar, memoria {growth:+.2f} MB, sin canvas")
        # Redimensionado (cursor fuera del logo para medir sin el estado de hover).
        page.mouse.move(700, 600)
        page.wait_for_timeout(260)
        for w in (390, 768, 1440):
            page.set_viewport_size({"width": w, "height": 900})
            page.wait_for_timeout(150)
            size = round(page.locator(".topbar .bs-mark").bounding_box()["width"])
            check((size == 38) if w <= 760 else (size == 46), f"Tamaño del logo de cabecera a {w}px: {size}")
        ok("Redimensionado 1440 → 390 → 768 → 1440: logo de cabecera 46/38 px sin errores")
        # API y temporada separadas de la marca.
        api = page.evaluate("""(()=>{const a=BurgerShotLogo.Animated({introKey:'x'}),c=BurgerShotLogo.Compact(),i=BurgerShotLogo.Icon(),l=BurgerShotLoader(),m=BurgerShotLogo.Mobile();
          const box=document.createElement('div');box.style.cssText='position:fixed;left:-999px';box.append(a,c,i,l,m);document.body.append(box);
          const r={variants:[a,c,i,l,m].map(e=>e.className),glow:getComputedStyle(a.querySelector('.bs-mark-glow')).opacity,seasons:BurgerShotLogo.seasons()};
          document.documentElement.removeAttribute('data-season');const plain=BurgerShotLogo.create({variant:'full'});box.append(plain);
          r.plainAccents=!!plain.querySelector('.bs-accents');r.plainGlow=getComputedStyle(plain.querySelector('.bs-mark-glow')).opacity;
          document.documentElement.setAttribute('data-season','dia-de-muertos halloween');box.remove();return r})()""")
        check(all(v in " ".join(api["variants"]) for v in ("bs-logo--full", "bs-logo--compact", "bs-logo--icon", "bs-logo--loader", "bs-logo--mobile")), f"Variantes de la API: {api}")
        check(api["glow"] == "1" and api["seasons"] == ["dia-de-muertos", "halloween"], f"Temporada activa: luz cálida tras el emblema: {api}")
        check(api["plainGlow"] == "0", f"Sin temporada la marca queda limpia: {api}")
        ok("API BurgerShotLogo (Animated, Compact, Icon, Loader, Mobile) y temporada desacoplada de la marca")
        ctx.close()

        # ── Móvil táctil: sin paralaje y versión compacta ──
        ctx, page = page_for(browser, "DEMO_ACCESO.html", 390, 844, mobile=True)
        page.locator("#authScreen").wait_for(state="visible")
        page.wait_for_timeout(1400)
        page.mouse.move(120, 160)
        page.mouse.move(150, 190, steps=5)
        page.wait_for_timeout(300)
        tilt_m = page.evaluate("document.querySelector('#authScreen .bs-mark').style.getPropertyValue('--tilt-y')")
        check(tilt_m in ("", "0deg", "0.000deg"), f"Sin paralaje en táctil: {tilt_m}")
        size_m = round(page.locator("#authScreen .bs-mark").bounding_box()["width"])
        check(size_m == 72, f"Logo compacto en móvil: {size_m}")
        ok("Móvil táctil: sin paralaje, logo de 72 px en el acceso")
        ctx.close()

        # ── Movimiento reducido ──
        ctx, page = page_for(browser, "DEMO_ACCESO.html", reduced=True)
        page.locator("#authScreen").wait_for(state="visible")
        page.wait_for_timeout(60)
        rm = page.evaluate("""(()=>{const logo=document.querySelector('#authScreen burgershot-logo');const a=document.getAnimations().filter(a=>logo.contains(a.effect?.target)||a.effect?.target===logo);
          return {n:a.length,props:[...new Set(a.flatMap(x=>x.effect.getKeyframes().flatMap(k=>Object.keys(k).filter(p=>!['offset','easing','composite','computedOffset'].includes(p)))))],
          veil:!!document.querySelector('.gate.is-logo-intro'),sheen:getComputedStyle(logo.querySelector('.bs-mark-sheen')).display}})()""")
        check(rm["props"] in ([], ["opacity"]) and not rm["veil"] and rm["sheen"] == "none", f"Movimiento reducido: solo fundido: {rm}")
        page.locator("#loginBtn").click()
        page.locator("#authLoading").wait_for(state="visible")
        fill = page.evaluate("getComputedStyle(document.querySelector('#authLoading .bs-mark-fill')).clipPath")
        check(fill == "none", f"Cargador estático y completo con movimiento reducido: {fill}")
        ok("Movimiento reducido: solo fundido de opacidad, sin reflejo, sin velo y cargador estático")
        ctx.close()

        # ── Respaldo: imágenes del logo bloqueadas ──
        ctx, page = page_for(browser, "DEMO_ACCESO.html", block=["assets/logo/"])
        page.locator("#authScreen").wait_for(state="visible")
        page.wait_for_function("document.querySelector('#authScreen burgershot-logo').classList.contains('is-loaded')", timeout=6000)
        src = page.evaluate("document.querySelector('#authScreen .bs-mark img').currentSrc")
        check(src.endswith("assets/burgershot-muertos.webp"), f"Respaldo al original: {src}")
        ctx.close()
        ctx, page = page_for(browser, "DEMO_ACCESO.html", block=["assets/logo/", "assets/burgershot-"])
        page.locator("#authScreen").wait_for(state="visible")
        page.wait_for_function("document.querySelector('#authScreen burgershot-logo').classList.contains('is-fallback')", timeout=6000)
        page.wait_for_function("!document.querySelector('#authScreen burgershot-logo').classList.contains('is-intro')", timeout=4000)
        mono = page.evaluate("(()=>{const m=document.querySelector('#authScreen .bs-mark');const s=getComputedStyle(m,'::after');return [s.content,m.getBoundingClientRect().width]})()")
        check('"BS"' in mono[0] and round(mono[1]) == 128, f"Monograma de respaldo visible: {mono}")
        ok("Respaldo: sin las copias usa el logo original; sin ningún archivo muestra el monograma BS (nunca vacío)")
        ctx.close()

        # ── Conexión lenta (servidor real + limitación de red) ──
        try:
            urllib.request.urlopen(SERVER + "/DEMO_ACCESO.html", timeout=2)
            ctx = browser.new_context(viewport={"width": 1280, "height": 800})
            page = ctx.new_page()
            page.on("pageerror", lambda e: errors.append(str(e)))
            cdp = ctx.new_cdp_session(page)
            cdp.send("Network.enable")
            cdp.send("Network.emulateNetworkConditions", {"offline": False, "latency": 400, "downloadThroughput": 60 * 1024, "uploadThroughput": 30 * 1024})
            page.add_init_script("window.__cls=0;new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)window.__cls+=e.value}).observe({type:'layout-shift',buffered:true});")
            page.goto(SERVER + "/DEMO_ACCESO.html", wait_until="domcontentloaded", timeout=60000)
            page.locator("#authScreen").wait_for(state="visible", timeout=60000)
            early = page.evaluate("(()=>{const l=document.querySelector('#authScreen burgershot-logo');const m=l.querySelector('.bs-mark');return {loaded:l.classList.contains('is-loaded'),w:m.offsetWidth,ph:getComputedStyle(m,'::before').opacity}})()")
            page.wait_for_function("document.querySelector('#authScreen burgershot-logo').classList.contains('is-loaded')", timeout=60000)
            late = page.evaluate("[document.querySelector('#authScreen .bs-mark').offsetWidth,window.__cls]")
            check(early["w"] == late[0] == 128, f"El hueco del logo no cambia de tamaño al cargar: {early} {late}")
            check(early["loaded"] or early["ph"] == "1", f"Mientras carga se ve el marcador: {early}")
            check(late[1] < 0.02, f"CLS con conexión lenta: {late[1]}")
            notes.append(f"Conexión lenta (400 ms, 60 KB/s): marcador visible={not early['loaded']}, CLS {late[1]:.4f}")
            ok("Conexión lenta: marcador del tamaño final mientras carga, sin desplazamientos")
            ctx.close()
        except OSError:
            notes.append("Conexión lenta no probada: no hay servidor en " + SERVER)
    finally:
        browser.close()

check(not errors, f"Errores de JavaScript: {errors[:5]}")
ok("Sin errores de JavaScript")
out = {"date": datetime.now().isoformat(timespec="seconds"), "browser": "Microsoft Edge (Chromium) headless", "passed": results, "notes": notes}
(ROOT / "tests" / "logo-browser-results.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"\n{len(results)} escenarios superados.")
