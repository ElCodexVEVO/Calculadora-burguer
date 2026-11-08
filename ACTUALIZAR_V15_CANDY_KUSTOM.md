# Actualizar a Burger Shot 15.2 · Candy Kustom

Rediseño visual completo. No cambia la base de datos, los permisos, los cálculos ni las funciones: no hay migración SQL.

## Archivos que debes publicar

- `index.html` (carga la capa nueva, precarga las tipografías y cambia el color de la barra del navegador).
- `kustom.css`, `kustom.js`, `kustom-scene.js` (capa visual, movimiento y escena ilustrada).
- `app.js`, `companion.js` y `restaurant/building.js` (las imágenes del menú apuntan a las fotos y, si no hay foto, a la ilustración).
- Carpeta `assets/menu-fotos/` (fotos del menú: recortes para tarjetas, miniaturas y originales, con `ORIGEN.json`).
- Carpeta `assets/kustom/` (ilustraciones de respaldo para productos sin foto).
- Carpeta `assets/fonts/kustom/` (Barlow, Barlow Condensed, Grenze Gotisch y Yellowtail, con sus licencias).
- `DEMO_V6.html` y `DEMO_ACCESO.html` regenerados con `node demo/build-demos.cjs`.

Conserva tu `config.js` si tu instalación usa otra conexión. Después de publicar, recarga con Ctrl + F5.

## Qué verás

- Acceso: noche de crucero con el lowrider llegando al local Burger Shot y una placa con la bienvenida rotulada.
- Inicio: banner ilustrado con el lowrider que salta en hidráulicos, cifras grandes sin cajas, ranking y placa del empleado de la semana.
- Caja: fotos reales del menú, ticket de papel de envoltura con placa roja tipo caja Burger Shot para el total y botón dorado de cobro.
- Todo el resto de módulos hereda la paleta medida en las fotos (negro rojizo, rojo de empaque, ámbar y crema), la tipografía y los controles.

## Movimiento

Salto hidráulico y chispas en la placa del total, vuelo de la comida al ticket, líneas que destellan al cambiar la cantidad, tarjetas que se acercan y se inclinan hacia el cursor, paralaje de la escena, estrella fugaz, entradas en cascada y microinteracciones. Movimiento reducido, modo Rendimiento y pestaña oculta los detienen. Los importes se muestran siempre al instante.

## Regenerar ilustraciones

```bash
node design/kustom/build-food.cjs
```

## Comprobación

Desde `tests/`: `npm ci` y `npm test` (239 escenarios en verde). La única prueba ajustada fue la ruta de la miniatura del ticket, que ahora es `assets/menu-fotos/thumb/combo-burrito.webp`. La demo reparte sus ventas simuladas entre empleados para que el ranking tenga orden.

## Fotos del menú

Los 20 productos del catálogo usan fotos del negocio (`assets/menu-fotos`, origen en `ORIGEN.json`). Si agregas un producto nuevo sin foto, se muestra su ilustración de `assets/kustom/food`; para darle foto, colócala recortada a 720×480 en `assets/menu-fotos/webp/<clave>.webp` (y 240×160 en `thumb/`) y agrega la clave a `MENU_PHOTOS` en `app.js`.
