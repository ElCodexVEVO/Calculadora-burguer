# BurgerShot · Caja auxiliar V5.4.1

## Qué incluye

- Panel lateral con favoritos por empleado, búsqueda, combos y productos del catálogo existente.
- Cantidades personalizadas: escribe una cantidad (por ejemplo `100`) en un producto y añádela de una vez; también puedes editar directamente la cantidad de una línea de la orden.
- Cantidades rápidas `+10`, `+25`, `+50` y `+100`, vista previa `cantidad × precio = importe`, Enter para añadir y confirmación antes de agregar una cantidad grande.
- Plantillas de pedidos por cuenta: guarda pedidos frecuentes, cárgalos con un clic y elimínalos cuando ya no los uses.
- Cliente / ID obligatorio, sugerencias de clientes y repetición de su última compra activa con precios actuales.
- Tipo de cliente, convenios y comisión calculados con las mismas reglas del punto de venta.
- Copiar el mensaje con el total para pegarlo en el chat de FiveM.
- Revisión del importe recibido y confirmación manual antes de registrar la venta.
- Lectura local de una captura PNG/JPG/WebP, selección del aviso y campos corregibles.
- Lanzador de escritorio con ventana siempre visible y Ctrl + Alt + B para mostrar/ocultar.

La aplicación funciona junto a FiveM. El cobro y la entrega de productos se hacen en el juego; el auxiliar registra lo que tú confirmas. No requiere acceso al servidor.

## 1. Qué actualizar en GitHub

Descomprime el ZIP. En el mismo repositorio de tu página, reemplaza/agrega estos archivos respetando las carpetas:

- `index.html`
- `app.js`
- `companion-core.js`
- `companion.js`
- `companion.css`
- `pos.css`
- `supabase_patch_v5_4_quantities.sql`
- La carpeta completa `assets/ocr/` (incluye los archivos `.wasm`, `.js` y `.gz`).

**Conserva tu `config.js` actual**, que contiene tu conexión pública a Supabase. El del paquete está vacío para nuevas instalaciones: no lo reemplaces en tu página ya configurada.

Conserva también las demás carpetas de `assets/` de tu instalación. El auxiliar usa los logos y fotos de productos que ya tiene la página.

Guarda los cambios en GitHub y espera a que el despliegue de Pages termine correctamente. Abre tu página y pulsa Ctrl + F5. En el menú aparece **Caja auxiliar**.

Ejecuta también `supabase_patch_v5_4_quantities.sql` en el SQL Editor después de V5.1 para que el Historial de cambios muestre los productos y cantidades anteriores y nuevas. No necesitas volver a desplegar las Edge Functions. Reutiliza tus tablas y permisos actuales. Si las notificaciones de Discord siguen fallando en tu instalación, hay que resolver ese problema aparte: la caja utiliza la función `discord-notify` existente y no cambia sus secretos o canales.

## 2. Cómo abrir la ventana en Windows

1. Conserva la carpeta `desktop` en tu PC. No necesitas subirla a GitHub para utilizarla.
2. Entra a esa carpeta y abre **INICIAR_BURGERSHOT.bat** con doble clic.
3. La primera vez instala el motor de la ventana. Necesita Internet y Node.js instalado. Si ya utilizas `npx supabase`, probablemente ya lo tienes. En caso contrario instala Node.js LTS desde https://nodejs.org y vuelve a abrir el archivo.
4. Inicia sesión con tu usuario habitual de BurgerShot. La app de escritorio conserva su propia sesión; iniciar sesión en Chrome no la inicia automáticamente aquí.
5. Coloca FiveM en **ventana sin bordes** para poder mostrar el auxiliar encima. El modo de pantalla completa exclusiva puede ocultarlo. Comprueba el comportamiento en tu equipo.
6. Usa el botón de la chincheta para fijar/soltar la ventana. Arrástrala por su barra de título o redimensiónala por los bordes.
7. **Ctrl + Alt + B** muestra/oculta el auxiliar. Si el atajo está ocupado, usa su icono en la barra de tareas. La tecla Alt muestra el menú de la app.

El lanzador abre `https://elcodexvevo.github.io/Calculadora-burguer/?auxiliar=1`. Si cambias de repositorio o dirección, edita solo el campo `url` en `desktop/settings.json`; usa la dirección pública HTTPS de tu página, no la URL del panel de Supabase.

También puedes entrar desde la web a Caja auxiliar y pulsar el icono de ventana. Esta opción abre una ventana del navegador; mantenerla siempre encima requiere el lanzador de escritorio. Cada ventana tiene su propia orden sin guardar: termina una venta en una sola ventana.

## 3. Registrar un pedido

1. Agrega productos; los favoritos se marcan con la estrella en Menú. Para una venta grande, escribe la cantidad en el campo **Cantidad** de la tarjeta y pulsa `+` en el POS, o pulsa **Añadir** en el auxiliar. También puedes usar `+10`, `+25`, `+50` o `+100`; la vista previa muestra el importe antes de añadir. Enter confirma el campo de cantidad. El límite técnico por producto es 9,999.
2. Usa **Plantillas** debajo del encabezado de la orden para guardar un pedido frecuente. Las plantillas se guardan por empleado y sucursal en este navegador; no modifican la base de datos hasta registrar una venta.
3. Escribe o elige el **Cliente / ID**. Las sugerencias salen de ventas ya registradas. Un administrador ve las de toda su sucursal; un empleado usa las de sus propias ventas. No se consultan jugadores de FiveM.
4. Revisa el tipo de cliente y el convenio cuando corresponda. El total incluye sus descuentos.
5. Pulsa **Copiar total** si quieres pegar el mensaje en el chat del juego.
6. Cobra dentro de FiveM y pulsa **Revisar cobro** en el auxiliar.
7. Escribe el importe que recibiste o usa una captura como se explica abajo.
8. Comprueba el nombre y el importe. Marca **Confirmo que recibí el pago en el juego** y pulsa **Confirmar y registrar**.

Sin cliente, sin importe válido, con un importe distinto al pedido o sin marcar la confirmación, el botón queda bloqueado. Si el catálogo o la orden cambian durante la revisión, cierra el cobro y vuelve a revisarlo. Al guardar se registra la venta en Supabase y se llama a tu notificador de Discord existente.

El importe es el del pedido, no el efectivo entregado antes del cambio. Este flujo no admite pagos parciales ni divide una venta en varios pagos.

## 4. Leer una captura del pago

1. Cuando aparezca el aviso del pago en FiveM, pulsa **Win + Shift + S** y recorta únicamente ese aviso.
2. Abre Revisar cobro y pulsa **Pegar captura**, o pega con **Ctrl + V**. También puedes usar **Elegir imagen**.
3. Si la imagen tiene información adicional, arrastra sobre ella para marcar solo el aviso. Puedes volver a la imagen completa o quitarla.
4. Pulsa **Leer captura**. La primera lectura puede tardar más mientras carga el lector; no se analiza la pantalla de forma continua.
5. Revisa los datos rellenados y corrígelos si hace falta. Si hay varios importes, la app deja el campo en blanco para evitar elegir uno por su cuenta.
6. Confirma manualmente el pago para registrar.

El reconocimiento se ejecuta en tu dispositivo con Tesseract. La imagen no se envía a Discord, Supabase ni a un servicio de IA. Los archivos del lector se descargan de tu propia página y se incluyen en `assets/ocr/`. La captura se descarta al cerrar la revisión, registrar o cerrar sesión; no se guarda como comprobante.

El lector reconoce importes con símbolo `$` o `MXN` y patrones como “Valeria Cruz te pagó $2,000”, “Cliente: Valeria Cruz” o “Has recibido $2,000 de Valeria Cruz”. Otros formatos pueden requerir escribir el nombre o importe. Una captura no demuestra que el pago ocurrió: la confirmación sigue siendo tuya.

## Alcance de las pruebas

Consulta `VERIFICACION_AUXILIAR.md`. Las pruebas de ventas utilizan datos simulados y no cobran ni registran pedidos en tu negocio. La ejecución junto a FiveM en Windows debe comprobarse en tu PC.
