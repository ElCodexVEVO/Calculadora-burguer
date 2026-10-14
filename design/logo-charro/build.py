"""Genera las capas y variantes del logo «esqueleto charro» a partir de charro-original.webp.
Uso (desde la raíz del proyecto):  py design/logo-charro/build.py
Salida en assets/logo/. No redibuja el arte: solo recorta, separa por color (neón y llamas) y deriva variantes."""
from pathlib import Path
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageChops

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / "assets" / "logo"
src = Image.open(ROOT / "design/logo-charro/charro-original.webp").convert("RGBA")
W, H = src.size  # 1125 x 902

def ramp(x, a, b):
    return np.clip((x - a) / (b - a), 0, 1)

hsv = np.array(src.convert("RGB").convert("HSV")).astype(float)
h, s, v = hsv[..., 0] * 360 / 255, hsv[..., 1] / 255, hsv[..., 2] / 255

# ── Neón rojo: tono rojizo muy saturado y brillante (los cempasúchil son más amarillos) ──
neon = ramp(v, .80, .97) * ramp(s, .55, .8) * (1 - ramp(h, 10, 19))
neon = np.where((h < 16) | (h > 345), neon, 0)
for box in [(100, 320, 260, 540), (820, 420, 1010, 560), (0, 560, 70, 780), (1040, 580, 1125, 700)]:  # ramos de cempasúchil
    x0, y0, x1, y1 = box
    neon[y0:y1, x0:x1] *= 0.0
neon_img = Image.fromarray((neon * 255).astype("uint8"))

# ── Llamas de las cuatro velas: tono cálido, casi blanco en el centro, solo cerca de cada mecha ──
flames = np.zeros_like(neon)
for cx, cy in [(180, 332), (105, 462), (948, 380), (1017, 497)]:
    x0, x1, y0, y1 = cx - 34, cx + 34, cy - 48, cy + 26
    sub = ramp(v[y0:y1, x0:x1], .88, .98) * (1 - ramp(s[y0:y1, x0:x1], .75, .95)) + ramp(v[y0:y1, x0:x1], .9, .99) * .4
    sub = np.clip(sub, 0, 1) * (np.abs(h[y0:y1, x0:x1] - 38) < 28)
    flames[y0:y1, x0:x1] = np.maximum(flames[y0:y1, x0:x1], sub)
flame_img = Image.fromarray((flames * 255).astype("uint8"))

def blur(img, r):
    return img.filter(ImageFilter.GaussianBlur(r))

rgb = np.array(src.convert("RGB")).astype(float)
alpha = np.array(src.split()[3]).astype(float)

# Base «apagada»: neón y llamas atenuados (el parpadeo los devuelve a su brillo).
dim = 1 - .62 * np.array(blur(neon_img, 1.2)).astype(float) / 255 - .6 * np.array(blur(flame_img, 1.6)).astype(float) / 255
base = np.dstack([np.clip(rgb * dim[..., None], 0, 255), alpha]).astype("uint8")
base_img = Image.fromarray(base, "RGBA")

def overlay(mask_img, halo_color, halo_r, halo_gain, boost):
    m = np.array(mask_img).astype(float) / 255
    halo = np.array(blur(mask_img, halo_r)).astype(float) / 255
    halo = np.clip(halo * halo_gain, 0, 1)
    core = np.clip(rgb * boost, 0, 255)
    hc = np.array(halo_color, dtype=float)
    # núcleo con el color del arte; alrededor, un halo suave
    a = np.clip(np.maximum(m, halo * .9), 0, 1)
    col = (core * m[..., None] + hc * (1 - m[..., None]))
    out = np.dstack([col, a * 255 * (alpha / 255)]).astype("uint8")
    return Image.fromarray(out, "RGBA")

neon_layer = overlay(neon_img, (255, 62, 36), 11, 2.4, 1.25)
flame_layer = overlay(flame_img, (255, 170, 60), 14, 3.2, 1.2)

def save(img, name, widths, q=88):
    for w in widths:
        r = img.resize((w, round(img.height * w / img.width)), Image.LANCZOS)
        r.save(OUT / f"{name}-{w}.webp", "WEBP", quality=q, method=6)

save(src, "charro", [480, 960])                # emblema completo (original)
save(base_img, "charro-base", [480, 960])     # base con neón y llamas atenuados
save(neon_layer, "charro-neon", [480, 960], 82)
save(flame_layer, "charro-llamas", [480, 960], 82)

def feather(img, top=0, bottom=0, side=0):
    a = img.split()[3]
    w, hh = img.size
    m = Image.new("L", (w, hh), 255)
    d = ImageDraw.Draw(m)
    for i in range(top):
        d.line([(0, i), (w, i)], fill=int(255 * i / top))
    for i in range(bottom):
        d.line([(0, hh - 1 - i), (w, hh - 1 - i)], fill=int(255 * i / bottom))
    for i in range(side):
        d.line([(i, 0), (i, hh)], fill=min(255, int(255 * i / side)) if False else 255)
    out = img.copy()
    out.putalpha(ImageChops.multiply(a, m))
    return out

# Rótulo: solo el letrero con el nombre (para cabeceras compactas).
rotulo = feather(src.crop((20, 462, 1105, 880)), top=34)
save(rotulo, "charro-rotulo", [480, 960])
# Wordmark: únicamente BURGER SHOT.
wordmark = feather(src.crop((40, 515, 1090, 785)), top=20, bottom=20)
save(wordmark, "charro-wordmark", [360, 720])
# Busto: esqueleto, hamburguesa y arco, sin letrero.
busto = feather(src.crop((150, 0, 1000, 540)), bottom=70)
save(busto, "charro-busto", [360, 720])

# Medalla: cara del esqueleto bajo el sombrero, en círculo con aro dorado.
def medal(size):
    cx, cy, r = 640, 240, 175
    face = src.crop((cx - r, cy - r, cx + r, cy + r)).resize((size, size), Image.LANCZOS)
    mask = Image.new("L", (size, size), 0)
    ImageDraw.Draw(mask).ellipse((2, 2, size - 3, size - 3), fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(size / 140))
    bg = Image.new("RGBA", (size, size), (20, 6, 10, 255))
    bg.alpha_composite(face)
    bg.putalpha(mask)
    ring = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(ring)
    w = max(2, size // 22)
    d.ellipse((1, 1, size - 2, size - 2), outline=(255, 176, 70, 255), width=w)
    d.ellipse((1 + w, 1 + w, size - 2 - w, size - 2 - w), outline=(150, 30, 20, 230), width=max(1, w // 3))
    bg.alpha_composite(ring)
    return bg
for sz in (64, 128, 256):
    medal(sz).save(OUT / f"charro-medalla-{sz}.webp", "WEBP", quality=90, method=6)
medal(32).save(OUT / "favicon-charro-32.png")
medal(180).save(OUT / "favicon-charro-180.png")

# Sello: duotono dorado sobre transparente (marca de agua para estados vacíos).
lum = np.array(src.convert("L")).astype(float) / 255
a2 = np.clip((lum - .12) * 1.5, 0, 1) * (alpha / 255)
gold = np.zeros((H, W, 4), dtype="uint8")
gold[..., 0] = np.clip(120 + 135 * lum, 0, 255)
gold[..., 1] = np.clip(50 + 110 * lum, 0, 255)
gold[..., 2] = np.clip(15 + 40 * lum, 0, 255)
gold[..., 3] = (a2 * 255).astype("uint8")
save(Image.fromarray(gold, "RGBA"), "charro-sello", [480], 80)
print("ok")
