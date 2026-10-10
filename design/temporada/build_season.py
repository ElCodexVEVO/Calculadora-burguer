"""Genera la esquina de papel picado de la insignia de temporada (assets/season/papel-esquina.svg).

    py design/temporada/build_season.py assets/season

La ilustración de la insignia (vela, cempasúchil y calabaza) es la escena 3D de escena_3d.py.
"""
from math import cos, sin, radians
from pathlib import Path
import sys

OUT = Path(sys.argv[1])
OUT.mkdir(parents=True, exist_ok=True)
f = lambda v: f"{v:.2f}".rstrip("0").rstrip(".")


# ── Esquina de papel picado: sector de círculo con festón y recortes (lienzo 100×100, esquina superior derecha) ──
R = 94
scallops = "".join(f'<circle cx="{f(100 + cos(radians(a)) * R)}" cy="{f(sin(radians(a)) * R)}" r="6.4"/>' for a in [93 + i * 7.6 for i in range(12)])
dots = "".join(f'<circle cx="{f(100 + cos(radians(a)) * (R - 1))}" cy="{f(sin(radians(a)) * (R - 1))}" r="1.9"/>' for a in [93 + i * 7.6 for i in range(12)])
inner = "".join(f'<circle cx="{f(100 + cos(radians(a)) * 78)}" cy="{f(sin(radians(a)) * 78)}" r="2.3"/>' for a in [100 + i * 10 for i in range(8)])
fx, fy = 100 + cos(radians(135)) * 50, sin(radians(135)) * 50
flower = "".join(f'<ellipse cx="{f(fx)}" cy="{f(fy - 11)}" rx="4.6" ry="9.600" transform="rotate({a} {f(fx)} {f(fy)})"/>' for a in range(0, 360, 45))


def heart(cx, cy, s, rot):
    return (f'<path transform="translate({f(cx)} {f(cy)}) rotate({rot}) scale({s})" '
            f'd="M0 6C-7 1-8-3-5-6c2-2 4-1 5 1 1-2 3-3 5-1 3 3 2 7-5 12Z"/>')


hearts = heart(100 + cos(radians(104)) * 62, sin(radians(104)) * 62, 1.25, 20) + heart(100 + cos(radians(166)) * 62, sin(radians(166)) * 62, 1.25, -110)
corner = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" aria-hidden="true">
  <defs><mask id="pe" maskUnits="userSpaceOnUse" x="0" y="0" width="100" height="100">
    <g fill="#fff"><path d="M100 0V{R}A{R} {R} 0 0 1 {100 - R} 0Z"/>{scallops}</g>
    <g fill="#000">{dots}{inner}{flower}<circle cx="{f(fx)}" cy="{f(fy)}" r="0"/>{hearts}</g>
    <circle cx="{f(fx)}" cy="{f(fy)}" r="3.4" fill="#fff"/>
  </mask></defs>
  <rect width="100" height="100" fill="#6a4427" mask="url(#pe)"/>
</svg>
'''
(OUT / "papel-esquina.svg").write_text(corner, encoding="utf-8")
print("ok")
