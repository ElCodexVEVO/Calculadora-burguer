"""Barrido visual: recorre todas las pantallas de la demo en varios anchos y avisa de lo que se rompe.

Uso (con un servidor estático en el puerto 8000 sirviendo la raíz del proyecto):
    py tests/visual-sweep.py                      # revisa y guarda capturas en preview/sweep/
    py tests/visual-sweep.py --out antes          # carpeta de capturas distinta
    py tests/visual-sweep.py --compare antes      # además, % de píxeles que cambiaron frente a otra carpeta
    py tests/visual-sweep.py --widths 390,1440    # solo algunos anchos
    py tests/visual-sweep.py --no-stress          # sin la pasada de importes grandes

Comprueba, para cada pantalla y ancho, con los datos normales y con todos los importes sustituidos por «$2,251,720»:
  · desplazamiento horizontal de la página (y de las tablas, solo en 1280 px o más y con datos normales: en pantallas
    estrechas se desplazan a propósito);
  · texto cortado por un contenedor con overflow oculto (sin puntos suspensivos intencionados);
  · errores de JavaScript.
Usa movimiento reducido para que las capturas sean comparables. Código de salida 1 si hay hallazgos.
Con --compare, la reloj y la fecha del encabezado se ocultan para no producir diferencias falsas.
"""
import argparse
import re
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BASE = "http://127.0.0.1:8000/DEMO_V6.html"
EDGE = "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe"
PAGES = ["dashboard", "pos", "mySales", "analytics", "allSales", "customers", "employees", "payouts", "audit",
         "discounts", "products", "administration", "loyalty", "promotions", "profile", "settings"]
SIZES = {390: 844, 768: 1024, 1280: 800, 1440: 900, 1920: 1080}

STRESS = r"""() => {
  const money = /^-?\$[\d,]+(\.\d+)?$/;
  let n = 0;
  document.querySelectorAll('.page.active strong, .page.active b, .page.active td, .page.active .metric strong').forEach(el => {
    if (el.children.length === 0 && money.test(el.textContent.trim())) { el.textContent = '$2,251,720'; n++; }
  });
  return n;
}"""

CHECK = r"""() => {
  const out = [];
  const doc = document.documentElement;
  if (doc.scrollWidth > innerWidth + 1) out.push(['página con desplazamiento horizontal', doc.scrollWidth + ' > ' + innerWidth]);
  const label = e => (e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') + (typeof e.className === 'string' && e.className.trim() ? '.' + e.className.trim().split(/\s+/).slice(0, 2).join('.') : ''));
  document.querySelectorAll('.page.active .table-wrap').forEach(w => {
    if (w.scrollWidth > w.clientWidth + 1) out.push(['tabla con desplazamiento horizontal', label(w) + ' ' + w.scrollWidth + ' > ' + w.clientWidth]);
  });
  const clips = el => { const s = getComputedStyle(el); return ['hidden', 'clip'].includes(s.overflowX) || ['hidden', 'clip'].includes(s.overflowY); };
  const seen = new Set();
  const scopes = document.querySelectorAll('.page.active, #sidebar, .topbar');
  scopes.forEach(scope => scope.querySelectorAll('*').forEach(el => {
    const text = [...el.childNodes].filter(n => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!text.length) return;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || +cs.opacity < .1) return;
    if (el.closest('.sr-only,.m-lights,.fg-decor,.papel-picado,.auth-scene,[aria-hidden=true],.hidden,[hidden]')) return;
    const r = document.createRange(); r.selectNodeContents(text[0]);
    const tr = r.getBoundingClientRect(); if (!tr.width || !tr.height) return;
    // primer ancestro que recorta: si es scroll (auto/scroll) se ignora; si recorta, el texto debe caber en él
    let a = el;
    while (a && a !== doc) {
      const s = getComputedStyle(a);
      if (['auto', 'scroll'].includes(s.overflowX)) return;
      if (clips(a)) break;
      a = a.parentElement;
    }
    if (!a || a === doc) return;
    if (getComputedStyle(el).textOverflow === 'ellipsis' || getComputedStyle(a).textOverflow === 'ellipsis') return;
    const ar = a.getBoundingClientRect();
    if (ar.width < 2) return;
    const over = Math.max(tr.right - ar.right, ar.left - tr.left);
    if (over > 1.5) {
      const key = label(el) + '|' + text[0].textContent.trim().slice(0, 28);
      if (!seen.has(key)) { seen.add(key); out.push(['texto cortado', key + ' (' + Math.round(over) + ' px) en ' + label(a)]); }
    }
  }));
  return out;
}"""


def run(args):
    out_dir = ROOT / "preview" / args.out
    out_dir.mkdir(parents=True, exist_ok=True)
    widths = [int(w) for w in args.widths.split(",")]
    findings, shots = [], []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, executable_path=EDGE, args=["--enable-unsafe-swiftshader", "--ignore-gpu-blocklist"])
        for w in widths:
            h = SIZES.get(w, 900)
            for stress in ([False] if args.no_stress else [False, True]):
                ctx = browser.new_context(viewport={"width": w, "height": h}, reduced_motion="reduce")
                page = ctx.new_page()
                errors = []
                page.on("pageerror", lambda e: errors.append(str(e)))
                page.goto(BASE)
                page.wait_for_selector("#app:not(.hidden)")
                page.wait_for_timeout(1500)
                if args.compare:
                    page.add_style_tag(content=".header-time,.clock-card,#todayDate,#todayTime,.v6-demobar{visibility:hidden!important}")
                for pid in PAGES:
                    page.evaluate("id=>document.querySelector(`.nav-item[data-page=\"${id}\"]`)?.click()", pid)
                    page.wait_for_timeout(700)
                    if pid == "pos":
                        for i in (0, 8, 9):
                            page.evaluate("id=>document.querySelector(`[data-add=\"${id}\"]`)?.click()", f"p{i}")
                        page.wait_for_timeout(300)
                    if stress:
                        page.evaluate(STRESS)
                        page.wait_for_timeout(150)
                    for kind, detail in page.evaluate(CHECK):
                        # Las tablas se desplazan a propósito en pantallas estrechas y con importes extremos.
                        if kind.startswith("tabla") and (w < 1280 or stress):
                            continue
                        findings.append((w, "importes grandes" if stress else "normal", pid, kind, detail))
                    if not stress:
                        file = out_dir / f"{pid}-{w}.png"
                        page.screenshot(path=str(file))
                        shots.append(file)
                for e in errors:
                    findings.append((w, "normal" if not stress else "importes grandes", "-", "error de JavaScript", e))
                ctx.close()
        browser.close()

    print(f"{len(shots)} capturas en {out_dir}")
    if args.compare:
        from PIL import Image, ImageChops
        ref = ROOT / "preview" / args.compare
        print(f"\nCambios frente a preview/{args.compare} (píxeles distintos):")
        changed = 0
        for f in sorted(shots):
            g = ref / f.name
            if not g.exists():
                print(f"  {f.name}: sin referencia")
                continue
            a, b = Image.open(f).convert("RGB"), Image.open(g).convert("RGB")
            if a.size != b.size:
                print(f"  {f.name}: tamaño distinto {b.size} -> {a.size}")
                changed += 1
                continue
            diff = ImageChops.difference(a, b).convert("L").point(lambda v: 255 if v > 24 else 0)
            pct = 100 * sum(diff.histogram()[255:]) / (a.width * a.height)
            if pct > args.threshold:
                print(f"  {f.name}: {pct:.2f} %")
                changed += 1
        print(f"  {changed} pantallas con cambios" if changed else "  sin cambios")

    if findings:
        print(f"\n{len(findings)} hallazgos:")
        for w, mode, pid, kind, detail in sorted(set(findings)):
            print(f"  [{w}px · {mode}] {pid}: {kind} — {detail}")
        return 1
    print("\nSin hallazgos.")
    return 0


if __name__ == "__main__":
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--out", default="sweep")
    ap.add_argument("--compare")
    ap.add_argument("--threshold", type=float, default=1.0, help="con --compare, %% mínimo de píxeles distintos para avisar (defecto 1; el ruido entre corridas es ~0,4)")
    ap.add_argument("--widths", default=",".join(str(w) for w in SIZES))
    ap.add_argument("--no-stress", action="store_true")
    sys.exit(run(ap.parse_args()))
