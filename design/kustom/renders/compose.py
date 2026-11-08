"""Compone fotos de menú para productos sin foto: la ilustración del producto sobre el
fondo real de las fotos del negocio (letrero con neón y mesa), con sombra y gradación cálida."""
import sys, pathlib, json
from PIL import Image, ImageFilter, ImageDraw, ImageEnhance
from playwright.sync_api import sync_playwright

proj = pathlib.Path(sys.argv[1]); tmp = pathlib.Path(sys.argv[2]); tmp.mkdir(parents=True, exist_ok=True)
orig = proj / 'assets/menu-fotos/originales'
keys = ['icecream']

# 1. Los renders con volumen ya están en tmp (renders.py): <clave>.png con fondo transparente.

# 2. Fondo: parte alta de una foto real (letrero y local) y la mesa con reflejos.
src = Image.open(orig / '7.webp').convert('RGB')
top = src.crop((0, 0, 1254, 470)).resize((720, 300), Image.LANCZOS).filter(ImageFilter.GaussianBlur(5))
table = src.crop((0, 1050, 1254, 1254)).resize((720, 200), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.2))
bg = Image.new('RGB', (720, 480))
bg.paste(top, (0, 0)); bg.paste(table, (0, 280))
# Costura suave entre el local y la mesa.
blend = top.resize((720, 300)).crop((0, 240, 720, 300))
mask = Image.linear_gradient('L').resize((720, 60)).transpose(Image.FLIP_TOP_BOTTOM)
bg.paste(blend, (0, 250), mask.point(lambda v: int(v * .8)))
bg = ImageEnhance.Brightness(bg).enhance(.92)

meta = {}
for k in keys:
    ill = Image.open(tmp / f'{k}.png').convert('RGBA')
    bbox = ill.getbbox(); ill = ill.crop(bbox)
    h = 350; w = int(ill.width * h / ill.height)
    if w > 560: w = 560; h = int(ill.height * w / ill.width)
    ill = ill.resize((w, h), Image.LANCZOS)
    # Gradación cálida suave para integrarla con la luz del local.
    r, g, b2, a = ill.split()
    warm = Image.merge('RGB', (r, g, b2)); warm = ImageEnhance.Color(warm).enhance(.95)
    tint = Image.new('RGB', warm.size, (255, 170, 110)); warm = Image.blend(warm, tint, .06)
    ill = Image.merge('RGBA', (*warm.split(), a))
    canvas = bg.copy().convert('RGBA')
    x = (720 - w) // 2; y = 458 - h
    shadow = Image.new('RGBA', (720, 480), (0, 0, 0, 0))
    ImageDraw.Draw(shadow).ellipse((x + w * .08, 432, x + w * .92, 470), fill=(0, 0, 0, 170))
    canvas = Image.alpha_composite(canvas, shadow.filter(ImageFilter.GaussianBlur(9)))
    # Reflejo tenue en la mesa barnizada.
    refl = ill.transpose(Image.FLIP_TOP_BOTTOM).crop((0, 0, w, min(60, h)))
    ra = refl.split()[3].point(lambda v: int(v * .18))
    refl.putalpha(Image.composite(ra, Image.new('L', ra.size, 0), Image.linear_gradient('L').resize(ra.size).transpose(Image.FLIP_TOP_BOTTOM)))
    canvas.alpha_composite(refl, (x, 452))
    canvas.alpha_composite(ill, (x, y))
    out = canvas.convert('RGB')
    out.save(proj / f'assets/menu-fotos/webp/{k}.webp', 'WEBP', quality=86, method=6)
    out.resize((240, 160), Image.LANCZOS).save(proj / f'assets/menu-fotos/thumb/{k}.webp', 'WEBP', quality=82, method=6)
    meta[k] = {'source': 'composición: render vectorial con volumen (design/kustom/renders/%s.svg) sobre el fondo de originales/7.webp (letrero y mesa)' % k}

o = json.loads((proj / 'assets/menu-fotos/ORIGEN.json').read_text(encoding='utf-8'))
o['items'].update(meta)
o['missing_photo_uses_illustration'] = []
o['composites'] = {'note': 'Helado, Caja Feliz y Cajita Feliz Policía no tienen foto del negocio: son composiciones provisionales de la ilustración sobre el fondo real de las fotos. Sustitúyelas por fotos cuando existan.', 'keys': keys}
(proj / 'assets/menu-fotos/ORIGEN.json').write_text(json.dumps(o, ensure_ascii=False, indent=2), encoding='utf-8')
print('ok', keys)
