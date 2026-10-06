# BurgerShot 6.5.2 · Cantidades rápidas en caja

Ahora puedes añadir varias unidades de un producto en una sola acción.

1. En Caja, escribe la cantidad en «Cantidad a agregar» de la tarjeta.
2. El botón muestra «Agregar 10», por ejemplo, y debajo ves el importe de esas diez unidades.
3. Pulsa ese botón o Enter para añadir todas las unidades al pedido.

Los botones **+5, +10, +25 y +50** suman esas unidades directamente. Puedes usarlos varias veces o combinar productos. El número de la tarjeta vuelve a 1 después de agregar una cantidad escrita; el pedido conserva todas las unidades agregadas. También puedes editar la cantidad en el pedido.

La tarjeta confirma las unidades añadidas. La animación lleva una sola imagen con el número del lote al pedido y funciona tanto con el ratón como con Enter. No se muestra una animación de éxito al cancelar una cantidad grande ni al introducir una cantidad inválida. Al activar movimiento reducido o apagar las animaciones, los efectos que estaban en curso se detienen.

Se conservan el límite de 9,999 unidades por producto y la revisión de cantidades de 100 o más. Las tarjetas tienen controles más grandes y se adaptan a pantallas estrechas; en tabletas, el pedido se coloca debajo del menú.

## Probar

Abre **DEMO_V6.html** o **VISTA_PREVIA.html**. La demo utiliza datos de ejemplo y sus ventas son simuladas.

Las capturas de esta versión están en:

- `preview/tarjeta-cantidad.png`
- `preview/caja-rapida-escritorio.png`
- `preview/caja-rapida-movil.png`

## Actualizar una instalación existente

Reemplaza `index.html`, `app.js`, `atelier.js` y `motion.js`, y añade `caja-rapida.css` en la misma carpeta. Para actualizar también la demo, reemplaza `DEMO_V6.html`. El archivo `index.html` ya incluye la nueva hoja de estilos y las referencias de versión para actualizar la caché.

Esta mejora de caja no requiere ejecutar ningún parche SQL. La configuración de conexión se mantiene en `config.js`.

## Verificación

- Las **139 comprobaciones existentes** de la aplicación y de PostgreSQL local/PGlite pasaron.
- Pasaron **11 escenarios adicionales en Chromium**, incluido un cobro simulado con dos productos, cantidades diferentes y convenio.
- Se revisaron las capturas en escritorio y móvil y se comprobó que no hay desbordamiento en los anchos 320, 360, 390, 768, 1120, 1440 y 1600 px.
- La nueva prueba está en `tests/caja-rapida-browser.cjs` y su resultado en `tests/caja-rapida-results.json`. Requiere Playwright y Chromium para ejecutarse.

Estas verificaciones usan datos simulados y PostgreSQL local; no registran ventas ni ejecutan migraciones en tu Supabase real.
