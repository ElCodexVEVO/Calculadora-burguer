"""Burger Shot V7 · pruebas de navegador (Webapp Testing, Playwright para Python).

Uso desde la raíz del proyecto:
    py tests/v7-browser.py
Variables opcionales: CHROMIUM_EXECUTABLE (por defecto, Microsoft Edge instalado).

Sirve DEMO_V6.html y DEMO_ACCESO.html desde el disco mediante intercepción de peticiones
en http://burgershot.test/. Usa el Supabase simulado de demo/: no contacta con Supabase real.
Las peticiones externas (Google Fonts, CDN) se bloquean y se informan aparte.
Resultado: tests/v7-browser-results.json
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
results, notes = [], []
TYPES = {".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
         ".svg": "image/svg+xml", ".webp": "image/webp", ".png": "image/png", ".json": "application/json"}


def ok(name):
    results.append(name)
    print("PASS", name)


def check(cond, message):
    if not cond:
        raise AssertionError(message)


# Sesión de cajera sin permisos de administración (Valeria Torres, rol «Cajero» de la demo).
CASHIER_SEED = """;(()=>{const create=window.supabase.createClient;window.supabase.createClient=(...a)=>{const c=create(...a);
c.auth.getSession=async()=>({data:{session:{user:{id:'user-3',email:'valeria@ejemplo.invalid'}}},error:null});return c}})();"""


def open_page(browser, entry, width=1440, height=960, reduced=False, seed="", log=None):
    ctx = browser.new_context(viewport={"width": width, "height": height}, reduced_motion="reduce" if reduced else "no-preference")
    page = ctx.new_page()
    log = log if log is not None else {"errors": [], "failed": [], "external": set()}

    def route(r):
        url = r.request.url
        if not url.startswith(BASE):
            log["external"].add(url.split("/")[2])
            return r.abort()
        rel = url[len(BASE):].split("?")[0].split("#")[0] or "index.html"
        file = (ROOT / rel).resolve()
        if ROOT not in file.parents or not file.exists():
            log["failed"].append(rel)
            return r.fulfill(status=404, body="Not found")
        body = file.read_bytes()
        if rel == "demo/data.js" and seed:
            body = body + seed.encode()
        return r.fulfill(body=body, content_type=TYPES.get(file.suffix, mimetypes.guess_type(str(file))[0] or "application/octet-stream"))

    page.route("**/*", route)
    page.on("pageerror", lambda e: log["errors"].append(str(e)))
    page.on("console", lambda m: log["errors"].append("console: " + m.text) if m.type == "error" and "ERR_FAILED" not in m.text and "net::" not in m.text else None)
    page.on("dialog", lambda d: d.accept())
    page.goto(BASE + entry, wait_until="domcontentloaded")
    return ctx, page, log


def wait_app(page):
    page.locator("#app").wait_for(state="visible")
    page.locator("#authLoading").wait_for(state="hidden")
    page.wait_for_timeout(300)


def go(page, target):
    page.evaluate(f"document.querySelector('[data-page=\"{target}\"]').click()")
    page.wait_for_timeout(250)


def money_to_num(text):
    return float(text.replace("$", "").replace(",", "").replace("−", "-").replace("\u2212", "-").strip() or 0)


def expected_total(page, cart, client, discount_name):
    """Recalcula el total con las reglas de convenio documentadas, sin usar calc() de app.js."""
    data = page.evaluate("({products:fixture.db.products,discounts:fixture.db.discounts,profile:fixture.db.profiles.find(p=>p.user_id==='admin-1')})")
    products = {p["id"]: p for p in data["products"]}
    d = next(x for x in data["discounts"] if x["name"] == discount_name)
    lines = [{**products[i], "qty": q} for i, q in cart.items()]
    subtotal = sum(l["price"] * l["qty"] for l in lines)
    only = [c for c in (d.get("client_types") or []) if c]
    blocked = (d.get("exclude_public") and client in ("police", "sheriff", "ems")) or (only and client not in only)

    def eligible(line):
        if line["tag"] == "none":
            return False
        if d["scope"] == "all":
            return True
        if d["scope"] == "combos":
            return line["category"] == "combos"
        return line["tag"] == d["scope"]
    if blocked:
        disc = 0
    elif d["kind"] == "unit_price" and d.get("unit_price") is not None:
        disc = round(sum(max(0, l["price"] - d["unit_price"]) * l["qty"] for l in lines if eligible(l)), 2)
    else:
        disc = round(sum(l["price"] * l["qty"] for l in lines if eligible(l)) * (d["percent"] or 0) / 100)
    total = subtotal - disc
    return subtotal, disc, total, total * data["profile"]["commission_percent"] / 100


def set_cart(page, cart, client="general", discount="Sin convenio"):
    page.locator("#clearCartBtn").evaluate("b=>b.disabled||b.click()")
    for pid, qty in cart.items():
        page.locator(f"#bulkQty-{pid}").fill(str(qty))
        page.locator(f"[data-add='{pid}']").click()
    page.select_option("#clientType", client)
    did = page.evaluate(f"fixture.db.discounts.find(d=>d.name==={json.dumps(discount)}).id")
    page.select_option("#discountSelect", did)
    page.wait_for_timeout(60)


with sync_playwright() as pw:
    browser = pw.chromium.launch(headless=True, executable_path=EXE)
    log = {"errors": [], "failed": [], "external": set()}
    try:
        # ── Acceso: inválido, válido y cierre de sesión ──
        ctx, page, log = open_page(browser, "DEMO_ACCESO.html", log=log)
        page.locator("#authScreen").wait_for(state="visible")
        check(page.locator("#authScreen .logo img").evaluate("i=>i.complete&&i.naturalWidth===320"), "Logo del acceso no cargó")
        page.locator("#loginPassword").fill("incorrecta")
        page.locator("#loginBtn").click()
        page.wait_for_function("document.getElementById('loginError').textContent.trim().length>0", timeout=6000)
        check(page.locator("#app").is_hidden(), "La app no debe abrirse con contraseña incorrecta")
        check(page.locator("#loginBtn").is_enabled(), "El botón debe volver a habilitarse tras el error")
        ok("Acceso inválido muestra error y deja el formulario utilizable")
        page.locator("#loginPassword").fill("demo")
        page.locator("#loginBtn").click()
        wait_app(page)
        check(page.locator("#welcomeTitle").inner_text().startswith("¡Buenas"), "Saludo no visible")
        ok("Acceso válido abre el inicio")
        page.locator("#accountBtn").click()
        page.locator("#logoutBtn").click()
        page.locator("#authScreen").wait_for(state="visible", timeout=6000)
        check(page.locator("#app").is_hidden(), "La app sigue visible tras cerrar sesión")
        ok("Cerrar sesión vuelve al acceso")
        ctx.close()

        # ── Permisos: cajera sin administración ──
        ctx, page, log = open_page(browser, "DEMO_V6.html", seed=CASHIER_SEED, log=log)
        wait_app(page)
        check(page.locator(".nav-item[data-page='pos']").is_visible(), "La cajera debe ver Caja")
        for hidden in ("administration", "audit", "settings", "employees"):
            check(not page.locator(f".nav-item[data-page='{hidden}']").is_visible(), f"La cajera no debe ver {hidden}")
        check(page.locator("#editEmployeeWeekBtn").is_hidden(), "Configurar empleado de la semana es solo de administración")
        ok("Permisos: la cajera no ve secciones de administración")
        ctx.close()

        # ── Caja completa en escritorio ──
        ctx, page, log = open_page(browser, "DEMO_V6.html", log=log)
        wait_app(page)
        go(page, "pos")
        page.locator("[data-product='p0']").wait_for()
        page.locator("[data-add='p0']").click()
        page.locator("[data-add-preset='p8'][data-quantity='5']").click()
        check(page.locator("#orderCount").inner_text() == "6", "Contador tras agregar 1 + 5")
        page.locator("#bulkQty-p10").fill("3")
        page.locator("#bulkQty-p10").press("Enter")
        check(page.locator("#orderCount").inner_text() == "9", "Enter agrega la cantidad escrita")
        ok("Agregar por botón, por acceso rápido +5 y por Enter")
        page.locator("[data-q-input='p8']").fill("2")
        page.locator("[data-q-input='p8']").dispatch_event("change")
        check(page.locator("#orderCount").inner_text() == "6", "Editar la cantidad de una línea")
        page.locator("[data-q='p0'][data-d='1']").click()
        check(page.locator("#orderCount").inner_text() == "7", "Botón + suma uno")
        page.locator("[data-remove='p10']").click()
        check(page.locator("[data-remove='p10']").count() == 0, "Quitar línea")
        check(page.locator("#orderCount").inner_text() == "4", "Contador tras quitar línea")
        page.locator("#clearCartBtn").click()
        check(page.locator("#orderCount").inner_text() == "0" and page.locator("#grandTotal").inner_text() == "$0", "Vaciar orden")
        check(page.locator("#checkoutBtn").is_disabled(), "Cobrar deshabilitado con la orden vacía")
        ok("Cambiar cantidades, quitar y vaciar mantienen contador y total exactos")

        # ── Totales contrastados con las reglas reales ──
        cases = [
            ({"p0": 2, "p8": 1}, "general", "Sin convenio"),
            ({"p11": 2, "p8": 1}, "general", "Talleres"),
            ({"p11": 2}, "general", "SecuroServ"),
            ({"p0": 2, "p1": 1}, "general", "Precio Sheriff"),
            ({"p0": 2, "p1": 1}, "police", "Precio Sheriff"),
            ({"p0": 1, "p4": 2, "p9": 1}, "general", "Redline Mechanics"),
        ]
        for cart, client, discount in cases:
            set_cart(page, cart, client, discount)
            sub, disc, total, earn = expected_total(page, cart, client, discount)
            ui = {k: money_to_num(page.locator(f"#{k}").inner_text()) for k in ("subtotal", "discountAmount", "grandTotal", "checkoutTotal", "commissionPreview")}
            check(ui["subtotal"] == sub, f"Subtotal {cart} {discount}: {ui['subtotal']} != {sub}")
            check(abs(ui["discountAmount"]) == disc, f"Descuento {cart} {discount}: {ui['discountAmount']} != {disc}")
            check(ui["grandTotal"] == total and ui["checkoutTotal"] == total, f"Total {cart} {discount}: {ui['grandTotal']} != {total}")
            check(abs(ui["commissionPreview"] - earn) < 0.01, f"Comisión {cart}: {ui['commissionPreview']} != {earn}")
            notes.append(f"{discount} ({client}) {cart}: subtotal {sub}, descuento {disc}, total {total}")
        ok("Seis pedidos de ejemplo coinciden con las reglas de precios, convenios y comisión")
        set_cart(page, {"p0": 2}, "general", "Precio Sheriff")
        check("no aplica" in page.locator("#discountNote").inner_text(), "Aviso de convenio no aplicable")
        ok("Convenio exclusivo bloqueado muestra aviso y no descuenta")

        # ── Cobro, error real e historial ──
        set_cart(page, {"p0": 1, "p8": 2})
        before = page.evaluate("fixture.db.sales.length")
        page.evaluate("fixture.failNextSale=true")
        page.locator("#checkoutBtn").click()
        page.locator("#saleClient").fill("PRUEBA-V7")
        page.locator("#confirmSaleBtn").click()
        page.wait_for_selector(".toast.toast-error", timeout=5000)
        check(page.locator("#checkoutModal").is_visible(), "Tras el error la ventana de cobro sigue abierta")
        check(page.locator("#orderCount").inner_text() == "3", "Tras el error la orden se conserva")
        check(page.evaluate("fixture.db.sales.length") == before, "Un cobro fallido no debe registrar venta")
        ok("Cobro fallido: aviso de error, ventana abierta y orden intacta")
        page.locator("#confirmSaleBtn").click()
        page.wait_for_selector(".toast.toast-success", timeout=5000)
        page.locator("#checkoutModal").wait_for(state="hidden", timeout=2000)  # salida animada de 150 ms
        check(page.locator("#orderCount").inner_text() == "0", "La orden se vacía tras registrar")
        check(page.evaluate("fixture.db.sales.length") == before + 1, "La venta se guardó en la demo")
        go(page, "mySales")
        page.locator("#mySalesSearch").fill("PRUEBA-V7")
        page.wait_for_timeout(200)
        check(page.locator("#mySalesBody tr").filter(has_text="PRUEBA-V7").count() == 1, "La venta aparece en el historial")
        check("$480" in page.locator("#mySalesBody").inner_text(), "Importe correcto en el historial (280 + 2×100)")
        ok("Cobro correcto: aviso de éxito, orden vacía y venta en el historial con su importe")

        # ── Gráficas y Cliente de la semana con los datos de la demo ──
        go(page, "dashboard")
        page.wait_for_timeout(300)
        check(page.locator(".employee-week-bar").count() == 7, "Siete barras en la actividad semanal")
        check(page.locator(".employee-week-bar.has-sales").count() >= 1, "Al menos un día con ventas")
        heights = page.locator(".employee-week-bar.has-sales i").evaluate_all("els=>els.map(e=>e.getBoundingClientRect().height)")
        check(all(h > 3 for h in heights), "Barras con altura visible")
        ok("Inicio: gráfica semanal visible con barras proporcionales")
        go(page, "analytics")
        check(page.locator("#weeklyChart .bar-col").count() >= 1 and page.locator("#productRanking .rank-item").count() >= 1, "Estadísticas con gráfica y ranking")
        ok("Estadísticas: gráfica del período y productos más vendidos")
        go(page, "loyalty")
        expected = page.evaluate("""()=>{const now=new Date(),start=new Date(now);start.setHours(0,0,0,0);start.setDate(start.getDate()-((start.getDay()+6)%7));
          const end=new Date(start);end.setDate(end.getDate()+7);const g={};
          for(const s of fixture.db.sales){const d=new Date(s.created_at);if(s.status!=='active'||d<start||d>=end)continue;const k=String(s.client||'').trim();if(!k||k.toLowerCase()==='cliente general')continue;(g[k]??={n:k,c:0,t:0});g[k].c++;g[k].t+=Number(s.total)}
          return Object.values(g).sort((a,b)=>b.t-a.t||b.c-a.c||a.n.localeCompare(b.n,'es'))[0]||null}""")
        content = page.locator("#customerWeekContent").inner_text()
        check(expected is not None and expected["n"] in content, f"Cliente de la semana esperado {expected}")
        check(f"${expected['t']:,.0f}" in content, "Importe acumulado del cliente de la semana")
        check(page.locator("#page-dashboard #customerWeek").count() == 0, "Cliente de la semana no se muestra en el inicio")
        ok(f"Cliente de la semana en Clientes coincide con las ventas de la demo ({expected['n']}, ${expected['t']:,.0f})")

        # ── Teclado, foco y ventanas ──
        page.evaluate("document.activeElement?.blur();document.body.tabIndex=-1;document.body.focus();document.body.removeAttribute('tabindex')")
        page.keyboard.press("Tab")
        check(page.evaluate("document.activeElement.classList.contains('skip-link')"), "Primer Tab enfoca «Saltar al contenido»")
        page.keyboard.press("Enter")
        check(page.evaluate("document.activeElement.id")=="main", "Saltar al contenido mueve el foco al área principal")
        go(page, "pos")
        page.locator("#bulkQty-p0").focus()
        page.keyboard.press("Tab")
        ring = page.evaluate("(()=>{const s=getComputedStyle(document.activeElement);return s.outlineStyle!=='none'&&parseFloat(s.outlineWidth)>=2})()")
        check(ring, "Foco visible en el botón Agregar")
        page.keyboard.press("Enter")
        check(page.locator("#orderCount").inner_text() == "1", "Enter en Agregar añade al pedido")
        page.locator("#checkoutBtn").focus()
        page.keyboard.press("Enter")
        page.locator("#checkoutModal").wait_for(state="visible")
        page.keyboard.press("Escape")
        try:
            page.locator("#checkoutModal").wait_for(state="hidden", timeout=3000)
        except Exception:  # noqa: BLE001
            pass
        check(page.locator("#checkoutModal").is_hidden(), "Escape cierra la ventana de cobro")
        check(page.evaluate("document.activeElement.id") == "checkoutBtn", "El foco vuelve a Cobrar")
        ok("Teclado: salto al contenido, foco visible, Enter agrega y Escape cierra devolviendo el foco")

        # ── Movimiento normal: el vuelo al pedido no bloquea los controles ──
        page.locator("#clearCartBtn").click()
        page.evaluate("window.scrollTo(0,0)")
        page.locator("[data-add='p1']").click()
        page.wait_for_selector(".bs-fly", timeout=1000)
        page.locator("[data-add='p2']").click()
        check(page.locator("#orderCount").inner_text() == "2", "Se puede agregar mientras corre la animación")
        page.wait_for_selector(".bs-fly", state="detached", timeout=3000)
        check(money_to_num(page.locator("#grandTotal").inner_text()) == 560, "Total exacto tras animaciones")
        ok("Animación de agregar: vuelo al pedido sin bloquear clics y con total exacto")
        # Decoración sin interceptar el puntero.
        layers = page.evaluate("[...document.querySelectorAll('.papel-picado,.ambient-petals,.sidebar-scrim')].map(e=>getComputedStyle(e).pointerEvents+'|'+getComputedStyle(e).visibility)")
        hit = page.evaluate("(()=>{const b=document.querySelector('.category-tab');b.scrollIntoView({block:'center',behavior:'instant'});const r=b.getBoundingClientRect();return document.elementFromPoint(r.left+r.width/2,r.top+r.height/2).closest('.category-tab')===b})()")
        check(all(l.startswith("none") or l.endswith("hidden") for l in layers) and hit, f"Capas decorativas interceptan el puntero: {layers}")
        ok("Papel picado, pétalos y fondo del menú no interceptan clics")
        # Rendimiento: tareas largas durante 15 altas rápidas.
        page.evaluate("window.__long=[];new PerformanceObserver(l=>l.getEntries().forEach(e=>window.__long.push(e.duration))).observe({type:'longtask',buffered:false})")
        for _ in range(15):
            page.locator("[data-add-preset='p3'][data-quantity='5']").click()
        page.wait_for_timeout(900)
        long_tasks = page.evaluate("window.__long")
        check(max(long_tasks or [0]) < 250, f"Tareas largas: {long_tasks}")
        notes.append(f"Tareas largas durante 15 altas rápidas: {len(long_tasks)} (máx. {max(long_tasks or [0]):.0f} ms)")
        go(page, "dashboard")
        page.wait_for_timeout(700)
        infinite = page.evaluate("document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.getTiming().iterations===Infinity).length")
        notes.append(f"Animaciones ambientales en bucle en el inicio (1440 px): {infinite}")
        ok("Rendimiento: sin tareas largas al agregar en ráfaga")
        ctx.close()

        # ── Movimiento reducido ──
        ctx, page, log = open_page(browser, "DEMO_V6.html", reduced=True, log=log)
        wait_app(page)
        go(page, "pos")
        page.locator("[data-add='p0']").click()
        page.wait_for_timeout(80)
        check(page.locator(".bs-fly").count() == 0, "Sin vuelo con movimiento reducido")
        running = page.evaluate("document.getAnimations().filter(a=>a.playState==='running').length")
        check(running == 0, f"Animaciones en curso con movimiento reducido: {running}")
        check(page.locator(".ambient-petals").evaluate("e=>getComputedStyle(e).display==='none'||e.hidden"), "Pétalos ocultos")
        check(page.locator("#grandTotal").inner_text() == "$280", "Total exacto con movimiento reducido")
        ok("Movimiento reducido: sin animaciones en curso, sin pétalos y total exacto")
        page.evaluate("document.body.classList.add('motion-off')")
        ctx.close()

        # ── Anchos 390, 768 y 1440 ──
        for width, height in ((390, 844), (768, 1024), (1440, 960)):
            ctx, page, log = open_page(browser, "DEMO_V6.html", width, height, log=log)
            wait_app(page)
            for target in ("dashboard", "pos", "mySales", "analytics", "loyalty", "administration"):
                go(page, target)
                over = page.evaluate("document.documentElement.scrollWidth>innerWidth+1")
                check(not over, f"Desbordamiento horizontal en {target} a {width}px")
                clipped = page.evaluate("""[...document.querySelectorAll('.page.active button:not([disabled]), .page.active input, .page.active select')].filter(e=>{const r=e.getBoundingClientRect();return r.width>0&&(r.left<-1||r.right>innerWidth+1)&&!e.closest('.table-wrap,.category-tabs,.role-list,.v6-tabs')}).length""")
                check(clipped == 0, f"{clipped} controles fuera de la pantalla en {target} a {width}px")
            go(page, "pos")
            page.locator("[data-add='p0']").click()
            small = page.evaluate("[...document.querySelectorAll('.page.active button,.page.active label,.page.active small,.page.active span,.page.active p,.page.active strong,.page.active h3')].filter(e=>e.offsetParent&&e.textContent.trim()&&parseFloat(getComputedStyle(e).fontSize)<11).map(e=>e.textContent.trim().slice(0,20))")
            check(not small, f"Texto menor de 11px en caja a {width}px: {small[:5]}")
            targets = page.evaluate("[...document.querySelectorAll('#page-pos .product-card button, .qty button, .checkout, .category-tab')].filter(e=>e.offsetParent).map(e=>e.getBoundingClientRect()).filter(r=>r.height<32||r.width<32).length")
            check(targets == 0, f"{targets} controles táctiles de la caja menores de 32px a {width}px")
            if width < 1101:
                page.locator("#orderDock.is-visible").wait_for(timeout=2000)
                check(page.locator("#orderDockTotal").inner_text() == page.locator("#grandTotal").inner_text(), "La barra de pedido muestra el total real")
                page.locator("#orderDock button").click()
                page.wait_for_timeout(500)
                check(page.locator("#checkoutBtn").evaluate("b=>{const r=b.getBoundingClientRect();return r.top<innerHeight&&r.bottom>0}") or page.locator("#orderTitle").evaluate("t=>t.getBoundingClientRect().top<innerHeight"), "Ver pedido lleva al ticket")
                page.locator("#mobileMenu").click()
                check(page.locator("#mobileMenu").get_attribute("aria-expanded") == "true", "Menú abierto anunciado")
                page.keyboard.press("Escape")
                check(page.locator("#mobileMenu").get_attribute("aria-expanded") == "false", "Escape cierra el menú")
            logo = page.locator(".header-brand img").evaluate("i=>({w:i.naturalWidth,rw:i.getBoundingClientRect().width,ok:i.complete})")
            check(logo["ok"] and logo["w"] == 160 and logo["rw"] >= 34, f"Logo de cabecera a {width}px: {logo}")
            ok(f"{width}px: sin desbordes, controles dentro de pantalla, texto ≥11px, objetivos ≥32px, logo cargado ({logo['rw']:.0f}px)")
            ctx.close()

        # ── Recursos: favicon e imágenes del menú ──
        ctx, page, log = open_page(browser, "DEMO_V6.html", log=log)
        wait_app(page)
        go(page, "pos")
        page.wait_for_timeout(400)
        broken = page.evaluate("[...document.images].filter(i=>i.getAttribute('src')).filter(i=>i.loading!=='lazy'||i.getBoundingClientRect().top<innerHeight).filter(i=>i.complete&&i.naturalWidth===0).map(i=>i.src)")
        check(not broken, f"Imágenes rotas: {broken}")
        fav = page.evaluate("fetch(document.querySelector('link[rel=icon]').href).then(r=>r.status+' '+r.headers.get('content-type'))")
        check(fav.startswith("200 image/png"), f"Favicon: {fav}")
        ratios = page.evaluate("[...document.querySelectorAll('#productGrid .food-photo')].slice(0,6).map(i=>(i.getBoundingClientRect().width/i.getBoundingClientRect().height).toFixed(2))")
        check(all(abs(float(r) - 1.5) < 0.03 for r in ratios), f"Proporción 3:2 de las fotos: {ratios}")
        ok("Recursos: favicon, logo y fotos del menú cargan; fotos mantienen proporción 3:2")
        ctx.close()
    finally:
        browser.close()

    check(not log["errors"], f"Errores de JavaScript: {log['errors'][:5]}")
    check(not log["failed"], f"Recursos locales no encontrados: {log['failed']}")
    ok("Sin errores de JavaScript ni recursos locales faltantes")

out = {"date": datetime.now().isoformat(timespec="seconds"), "browser": "Microsoft Edge (Chromium) headless", "passed": results,
       "notes": notes, "external_blocked": sorted(log["external"]), "supabase_real": False}
(ROOT / "tests" / "v7-browser-results.json").write_text(json.dumps(out, ensure_ascii=False, indent=1), encoding="utf-8")
print(f"\n{len(results)} escenarios superados.")
