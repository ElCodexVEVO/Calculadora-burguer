"""Prepara los modelos 3D de primer plano (recortes con transparencia) para la interfaz.

    py design/props-source/build_props.py

Lee design/props-source/modelo-14..17.webp (arte aportado por el usuario), los recorta al contenido, los reduce a dos anchos
y detecta la posición de cada llama de vela (núcleo casi blanco rodeado de alfa alta) para que la interfaz anime su brillo
en el sitio exacto. Escribe assets/season/props/<nombre>-<ancho>.webp y props.json.

  14 → velas  : dos velas altas con calavera de azúcar y cempasúchil
  15 → esquina: guirnalda en L de cempasúchil y velas
  16 → guirnalda: guirnalda horizontal con velas y papel picado
  (el modelo 17, calavera con flores, se descartó a petición del usuario y no se usa)
"""
import json
from pathlib import Path

import cv2
import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
SRC = ROOT / "design" / "props-source"
OUT = ROOT / "assets" / "season" / "props"
OUT.mkdir(parents=True, exist_ok=True)

MODELS = {
    "velas": (14, (520, 860)),
    "esquina": (15, (420, 760)),
    "guirnalda": (16, (760, 1400)),
}


def detect_flames(rgba, bbox):
    """Centros (x, y normalizados al recorte, y tamaño relativo) de los núcleos de llama."""
    r, g, b, a = [rgba[..., i].astype(np.float32) for i in range(4)]
    core = (r > 250) & (g > 232) & (b > 150) & (a > 230)
    # la cera y los pétalos claros no son tan blancos: se exige además un máximo local muy luminoso
    lum = cv2.GaussianBlur((r + g + b) / 3, (0, 0), 3)
    core &= lum > np.percentile(lum[a > 230], 97.5)
    n, labels, stats, cents = cv2.connectedComponentsWithStats(core.astype("uint8"), connectivity=8)
    x0, y0, x1, y1 = bbox
    w, h = x1 - x0, y1 - y0
    found = []
    for i in range(1, n):
        area = stats[i, cv2.CC_STAT_AREA]
        if area < 140:
            continue
        cx, cy = cents[i]
        found.append((float(area), (cx - x0) / w, (cy - y0) / h, stats[i, cv2.CC_STAT_WIDTH] / w))
    found.sort(reverse=True)
    return found


meta = {}
for name, (num, widths) in MODELS.items():
    im = Image.open(SRC / f"modelo-{num}.webp").convert("RGBA")
    arr = np.array(im)
    ys, xs = np.where(arr[..., 3] > 24)
    pad = 6
    bbox = (max(xs.min() - pad, 0), max(ys.min() - pad, 0), min(xs.max() + pad, im.width), min(ys.max() + pad, im.height))
    flames = detect_flames(arr, bbox)
    # se conservan las llamas más grandes (hasta 4) y se descartan reflejos aislados
    top = [f for f in flames if f[0] >= 0.18 * flames[0][0]][:4] if flames else []
    crop = im.crop(bbox)
    for w in widths:
        h = round(crop.height * w / crop.width)
        crop.resize((w, h), Image.LANCZOS).save(OUT / f"{name}-{w}.webp", "WEBP", quality=88, method=6)
    meta[name] = {
        "size": [crop.width, crop.height],
        "ratio": round(crop.width / crop.height, 4),
        "widths": list(widths),
        "flames": [{"x": round(f[1], 4), "y": round(f[2], 4), "r": round(max(f[3], 0.012), 4)} for f in top],
    }
    print(name, crop.size, "llamas:", meta[name]["flames"])

(OUT / "props.json").write_text(json.dumps(meta, indent=1), encoding="utf-8")
print("ok")
