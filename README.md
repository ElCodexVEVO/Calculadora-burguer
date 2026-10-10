# Burger Shot V7 · Ofrenda nocturna

Renovación visual completa con un solo sistema de diseño: fondos carbón, texto crema, acentos naranja cempasúchil y detalles vino y ciruela, con la temática de Día de Muertos y Halloween en el marco (papel picado, velas, cempasúchil) y las zonas de trabajo despejadas. Conserva el logo ilustrado original, todas las funciones, cálculos y permisos.

- **Caja** más densa y rápida, ticket fijo en escritorio y barra de pedido con el total real en móvil y tableta.
- **Cliente de la semana** en la sección Clientes; la actividad semanal sigue en el inicio.
- **Logo como sistema**: componente `<burgershot-logo>` con entrada de marca, cargador propio, reflejo al pasar y respaldo, sobre el emblema original.
- **Insignia de temporada en 3D**: vela, cempasúchil y calabaza modelados en Blender y mostrados con Three.js solo cuando se ven, con imagen de respaldo.
- **Movimiento** ligado a acciones reales (agregar, cambiar cantidades, cobrar, errores) con soporte de movimiento reducido.
- **Imágenes WebP**: el menú pasa de 12 MB a 1,7 MB sin cambiar proporciones.

Consulta [la actualización V7](ACTUALIZAR_V7.md), el sistema visual en [DESIGN.md](DESIGN.md) y prueba **[DEMO_V6.html](DEMO_V6.html)** (datos simulados) o **[DEMO_ACCESO.html](DEMO_ACCESO.html)** (usuario `demo`, contraseña `demo`).

### Ejecutar y revisar en local

```
py -m http.server 8000 --bind 127.0.0.1
```

Abre http://localhost:8000/DEMO_V6.html para la demo o http://localhost:8000 para tu Supabase configurado.

### Pruebas

```
cd tests
npm install
npm test
```

Las pruebas de navegador necesitan Playwright y un Chromium o Edge instalado (`CHROMIUM_EXECUTABLE`): `node auth-browser.cjs`, `node caja-rapida-browser.cjs`, `node dashboard-browser.cjs` y, con Python desde la raíz, `py tests/v7-browser.py`, `py tests/logo-browser.py` y `py tests/season-browser.py`.

---

## Notas de V6.8


Inicio renovado con cifras más legibles, una paleta uniforme de ciruela y dorado, banner compacto y acceso directo a Caja. **Rendimiento del equipo** reemplaza a Cliente de la semana, junto al empleado destacado; la actividad semanal ocupa todo el ancho y permite consultar cada día con clic, foco o teclado.

Incluye animación de entrada de las barras y transición de los importes al actualizarse, con soporte para movimiento reducido y el ajuste de animaciones de la app. Consulta [la actualización V6.8](ACTUALIZAR_V6_8_PANEL.md) y prueba **[DEMO_V6.html](DEMO_V6.html)** con datos simulados.

El acceso de Día de Muertos y Halloween conserva el logo original, altar nocturno, velas, pétalos y papel picado animados. La pantalla de carga sigue la comprobación de sesión y la carga del negocio; los errores permiten volver a intentar.

Prueba el acceso en **[DEMO_ACCESO.html](DEMO_ACCESO.html)** con usuario `demo` y contraseña `demo`. Usa datos simulados. Consulta [la actualización V6.7](ACTUALIZAR_V6_7_ACCESO.md) para instalarla.

La caja permite agregar varias comidas de una vez: escribe la cantidad, pulsa Agregar o Enter, o usa los accesos +5, +10, +25 y +50. Incluye nuevas animaciones de tarjetas, botones, categorías, ventanas y avisos, con soporte para movimiento reducido.

Consulta [las mejoras de caja](ACTUALIZAR_V6_5_2_CAJA.md) y [las animaciones de V6.6](ACTUALIZAR_V6_6_ANIMACIONES.md). Puedes probarlas en `DEMO_V6.html` con datos simulados.

**Empieza por [LEEME_V6.md](LEEME_V6.md).** Incluye actualización, reglas de promociones y vista previa interactiva en DEMO_V6.html. Conserva tu config.js al actualizar.

---

## Documentación de la base V5.5

# BurgerShot V5.5 — POS, empleado de la semana, caja auxiliar, OCR y Discord

Proyecto completo HTML, CSS y JavaScript con Supabase. No necesita compilación.

## Si tu app ya funciona

Sigue **ACTUALIZAR_V5_5_EMPLEADO.md**. Esta versión conserva las actualizaciones anteriores y agrega el panel de empleado de la semana con foto, métricas, gráfica diaria y ranking. Si ya tienes V5.4.1, reemplaza solamente index.html, app.js y pos.css, y conserva tu config.js configurado. Ejecuta el contenido de `supabase_patch_v5_5_employee_week.sql` en Supabase. Si no instalaste la caja auxiliar y las cantidades rápidas, consulta también **ACTUALIZAR_V5_4_AUXILIAR.md**.

## Novedades

- Emblema BurgerShot recreado a partir de la referencia del usuario: hamburguesa con volumen, aro azul y gotas rojas, fondo transparente. Se aplica en la marca de la app, acceso, panel lateral y orden vacía. Asset WebP local optimizado.
- **Edición completa de órdenes:** las órdenes activas sin corte permiten corregir cliente, tipo de cliente, método de pago y nota, además de agregar/quitar productos o cambiar cantidades. Se recalculan subtotal, convenio, total, comisión y neto; el backend protege ventas pagadas.
- **Cantidades personalizadas:** en el POS puedes escribir una cantidad entre 1 y 9,999 en cada tarjeta y añadirla de una vez. También puedes editar directamente la cantidad de una línea en la orden. La caja auxiliar ofrece el mismo control.
- **Cantidades rápidas y plantillas:** botones `+10`, `+25`, `+50` y `+100`, vista previa del importe, Enter para añadir, confirmación de cantidades grandes y plantillas de pedidos frecuentes guardadas por cuenta y negocio.
- **Permisos específicos:** el administrador puede asignar editar órdenes, catálogo, empleados, reportes/clientes, pagos e historial. Las políticas RLS y la Edge Function aplican los permisos también fuera de la interfaz.
- **Historial de clientes:** clientes agrupados por Cliente / ID con compras activas, acumulado, convenios usados y detalle de órdenes. El administrador ve la negocio completa; un empleado autorizado ve sus ventas.
- **Detalle de cortes:** ventas, productos, importe, comisión original y neto. Botón Ver corte y exportación de sus ventas. Los cortes nuevos guardan snapshots al pagarse. Los cortes anteriores siguen consultándose por payout_id; se avisa si sus ventas disponibles no coinciden con los importes guardados.
- **Filtros:** Hoy, semana de lunes a domingo, mes natural o rango personalizado; empleado y estado donde corresponde. Mis ventas, Todas las ventas, Estadísticas y Pagos/cortes comparten filtros coherentes con sus totales. Los límites de fecha usan la hora local del dispositivo, indicada en pantalla. Los cortes se filtran por fecha del pago, las ventas por fecha de venta.
- **CSV filtrado:** incluye todas las filas que cumplen el filtro y la búsqueda, no solo la página visible. Los importes son numéricos, la fecha está en UTC y se neutralizan fórmulas en campos de texto.
- **Historial para administradores:** cambios de productos/precios, convenios, perfiles/comisiones/bajas, creación/anulación/borrado de ventas y registro de cortes. Autor, fecha y valores antes/después. Se consulta por fecha, responsable, registro y acción, con paginación.
- Las consultas de ventas, empleados, catálogo y cortes recorren las páginas de la API; no se recortan silenciosamente a 1000/3000 registros. Las tablas muestran 25 registros por página. Estadísticas muestra hasta 12 grupos de fechas y el ranking del período.
- **Webhook de Discord:** registra ventas nuevas, ediciones, anulaciones y pagos/cortes en embeds compactos con folio, cliente, empleado, importe, comisión y neto. Puedes usar un canal único o separar ventas, órdenes, anulaciones y pagos mediante secretos `DISCORD_WEBHOOK_*_URL`; las URLs quedan únicamente en la Edge Function.
- **Identidad por evento en Discord:** incluye cuatro logos SVG en `assets/discord/` para venta, orden, anulación y pago. Son opcionales: se activan guardando sus URLs públicas como secretos `DISCORD_ICON_*_URL`.
- **Caja auxiliar:** abre una vista lateral con favoritos por empleado, clientes frecuentes, repetición de la última compra con precios vigentes, copiar total para el chat de FiveM y revisión manual del importe antes de guardar.
- **Lectura local de pagos:** pega una captura del aviso, selecciona el área y deja que Tesseract.js rellene cliente e importe. La captura se procesa en el dispositivo y los datos se pueden corregir; siempre requiere confirmación manual.
- **Empleado de la semana:** el dashboard destaca automáticamente al empleado con mayor venta activa de lunes a domingo. Un administrador puede elegir manualmente a cualquier empleado activo, añadir una URL de foto o subirla al bucket protegido; se muestran ventas, total generado, comisión, ticket promedio, gráfica por día y ranking de la negocio.

## Alcance del historial

Los triggers registran las operaciones posteriores a instalar V5.1, en la misma transacción del cambio. No inventan eventos antiguos. RLS permite leerlos solo al administrador activo de su tienda; desde la app no existe permiso para insertar, editar o borrar eventos directamente.

Los cambios hechos por un usuario autenticado muestran su perfil. Las operaciones con service role o desde el SQL Editor, incluida creación/borrado de perfiles mediante la Edge Function existente, aparecen como **Servicio / SQL de administración**: esa función no transmite el actor al trigger. Los cambios de contraseña ocurren en Auth y no forman parte de este historial. No se copian contraseñas, tokens ni correos al historial.

El propietario de la base de datos mantiene sus facultades de administración. El historial no es un registro externo resistente a modificaciones del propietario de Supabase.

Los cortes nuevos bloquean las ventas seleccionadas y guardan sus detalles originales. Una venta que llega después de seleccionar las ventas del corte queda pendiente para el siguiente. La anulación posterior no cambia el importe ya pagado ni su snapshot.

## Funciones conservadas

Supabase Auth, acceso fijo para empleados, creación inicial de administrador, roles, comisiones, baja/reactivación, borrado protegido de perfiles, recuperación de contraseñas mediante employee-admin, convenios, restricciones EMS/Policía, descuentos, cobro y prevención de doble clic, ventas, anulación y borrado de órdenes, cortes y Realtime.

El POS conserva las 12 fotografías comerciales y sus miniaturas WebP, categorías, mayoreo, cantidades, búsqueda, orden compacta y selección manual de imagen de producto. No se sustituyen las fotos del menú por el logo.

## Instalar desde cero

1. En Supabase SQL Editor ejecuta, en este orden: **supabase_schema_v3.sql**, **supabase_patch_v4_2.sql**, **supabase_patch_v5_1.sql**, **supabase_patch_v5_2.sql**, **supabase_patch_v5_3_discord.sql**, **supabase_patch_v5_4_quantities.sql** y **supabase_patch_v5_5_employee_week.sql**. V4.1 y V4.2 son alternativas del mismo permiso; usa V4.2.
2. Despliega `supabase/functions/employee-admin/index.ts` en **employee-admin** y `supabase/functions/discord-notify/index.ts` en **discord-notify**, usando Supabase Dashboard o la CLI.
3. Rellena config.js con la URL y la clave pública publishable/anon de tu proyecto. Nunca uses service role en el navegador.
4. Para crear el primer administrador con conexión fija, añade temporalmente `allowInitialSetup: true` a window.BURGERSHOT_CLOUD. Crea la cuenta y retira esta propiedad al terminar. Si Supabase pide confirmación por correo, complétala para terminar la creación del perfil.
5. Publica los archivos de la carpeta burgershot con index.html en la raíz del alojamiento. Incluye reports.css, pos.css y assets/ completos. Crea los empleados desde Administración.
6. En Discord crea un webhook para el canal de avisos y copia su URL. En Supabase ve a **Edge Functions → discord-notify → Secrets** y guarda `DISCORD_WEBHOOK_URL` con esa URL. Nunca la pegues en `config.js`, `app.js` ni en GitHub.

## Ejecutar localmente en Windows

Dentro de la carpeta que contiene index.html, abre CMD y ejecuta, si tienes Python instalado:

```cmd
py -m http.server 8000 --bind 127.0.0.1
```

Abre **http://localhost:8000**. Se conecta a tu Supabase existente; no necesitas montar otra base local.

## Vista previa

**VISTA_PREVIA.html** muestra el POS con datos de ejemplo y una orden preparada. **VISTA_PREVIA_LOGO.html** muestra el nuevo logo con la orden vacía. Son vistas estáticas: para operar usa index.html con tu configuración.

## Verificación

Consulta **VERIFICACION.md** y **VERIFICACION_AUXILIAR.md**. Se verificaron el frontend con Supabase simulado, las cantidades rápidas, los permisos y el OCR local. No se hicieron operaciones sobre tu cuenta real. La ventana de Windows junto a FiveM se comprueba en el equipo de uso.
