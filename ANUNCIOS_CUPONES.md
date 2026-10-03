# Anuncios RP y cupones — V5.6

Esta actualización añade dos secciones al panel existente. No crea otra tienda ni necesita otra Edge Function.

## Activar en tu aplicación

1. En el proyecto de Supabase que ya usa la calculadora, abre **SQL Editor → New query**. Copia y ejecuta **una vez** el archivo completo [20261003060000_announcements_coupons.sql](supabase/migrations/20261003060000_announcements_coupons.sql). Espera a que termine correctamente. No vuelvas a ejecutar el esquema inicial para actualizar una tienda existente.
2. Publica los archivos de esta versión en tu alojamiento habitual: `index.html`, `app.js`, `marketing-core.js`, `marketing.js` y `marketing.css`. Conserva las demás carpetas y tu conexión actual en `config.js`.
3. Recarga con **Ctrl+F5** e inicia sesión como administrador. Verás **Anuncios RP** y **Cupones** en el menú. Los empleados verán Anuncios RP y podrán aplicar códigos al cobrar; la administración de cupones es exclusiva de administradores.

La base se actualiza primero. Hasta aplicar la migración, las ventas habituales y las plantillas base de anuncios siguen disponibles; los cupones y las plantillas compartidas mostrarán que no están disponibles. Si ese aviso continúa después de la actualización, comprueba la conexión y vuelve a pulsar Actualizar.

La migración es transaccional: si aparece un error, no publiques los archivos nuevos hasta resolverlo. No requiere claves privadas en el navegador. Esta entrega no ejecuta SQL ni registra ventas en tu proyecto real.

## Preparar un anuncio

Abre **Anuncios RP**, elige Apertura, Promoción, Evento, Cierre o Personalizado y completa los campos que aparecen. Puedes cambiar la plantilla y editar el mensaje final antes de pulsar **Copiar anuncio**. El prefijo es opcional: escribe `/anuncio` solo si ese es el comando que utiliza tu servidor.

Las variables admitidas son `{negocio}`, `{ubicacion}`, `{horario}`, `{oferta}`, `{codigo}`, `{evento}` y `{contacto}`. Si falta alguna, se marca antes de copiar. Los mensajes no se envían automáticamente al juego, Discord ni otros canales.

Los administradores pueden guardar, actualizar y eliminar plantillas del equipo. Los empleados pueden utilizarlas y ajustar su mensaje local. Desde una tarjeta de cupón, **Crear anuncio** completa el código, descuento y condiciones; revisa ubicación y texto antes de copiar.

## Crear y usar un cupón

En **Cupones → Nuevo cupón**, escribe un nombre interno y un código de 3 a 32 letras, números, guiones o guiones bajos. Se guarda en mayúsculas. Elige porcentaje o importe fijo, compra mínima, productos, fechas y máximo de usos. Deja las fechas o el máximo vacíos para no establecer ese límite. Las fechas se introducen y muestran en la zona horaria del dispositivo.

Puedes pausar o editar la promoción. Después del primer uso, el formulario conserva el código; los cambios de condiciones se aplican a futuros canjes. La tarjeta muestra usos consumidos y estado: activo, programado, vencido, agotado o pausado. Usa **Actualizar** para consultar los datos recientes.

Para cobrar, agrega productos y escribe el código en **Código promocional → Aplicar**. En Caja auxiliar está dentro de **Cliente, convenio y cupón**. Revisa el total y registra la venta normalmente.

- Solo se admite un cupón por venta y reemplaza el convenio seleccionado. Al quitarlo, vuelve a aplicarse el convenio.
- Si cambian productos, cantidades, precios o tipo de cliente, hay que volver a aplicar el código. Un cupón inválido bloquea el cobro hasta corregirlo o quitarlo.
- Los productos con etiqueta `none` nunca reciben descuento. La opción Hamburguesas, combos y mayoreos corresponde a los productos con etiqueta `burger` en el catálogo; Todos los elegibles admite las demás etiquetas salvo `none`.
- La compra mínima se comprueba sobre el subtotal completo. El descuento fijo se limita al importe de los productos elegibles y nunca produce un total negativo.
- La exclusión de Policía, Sheriff y EMS se comprueba en el servidor, al igual que las restricciones de cada producto.
- Aplicar un código solo consulta el descuento. El uso se consume junto con la venta, cuando la base de datos la confirma.
- Si falla la respuesta de red, reintenta **Registrar venta** sin cambiar la orden: dentro de la misma sesión se reutiliza el identificador y se devuelve la venta ya guardada. Cerrar/recargar la pestaña o quitar el cupón descarta ese identificador; en ese caso revisa el historial antes de repetir una venta dudosa.
- El total, descuento y comisión de una venta con cupón conservan sus valores originales. No se permite editar sus importes. Para corregir una orden, un administrador puede anularla y registrar otra. Anular o eliminar una venta **no devuelve** el uso del cupón.

## Validación técnica

La app sigue siendo estática: npm solo se usa para pruebas.

```bash
npm ci
npm test
npx playwright install chromium
npm run test:ui
```

`npm test` ejecuta 20 comprobaciones. La suite de base de datos usa PostgreSQL embebido con PGlite: carga el esquema del repositorio y esta migración, prueba RLS con roles distintos, canjes, reintentos, vigencia, precios, restricciones, comisión, historial e inserciones directas. No simula las funciones SQL. La exclusión del último uso se implementa con un bloqueo de fila; la suite comprueba dos consumidores sucesivos, no una prueba de carga con sesiones PostgreSQL paralelas.

La prueba de navegador usa Playwright y una instancia de Supabase simulada en memoria, con las conexiones externas bloqueadas. Cubre las dos pantallas, guardado de plantillas y cupones, reemplazo de convenio, invalidación del descuento, respuesta de venta perdida, caja auxiliar, permisos y ausencia de la migración. Guarda capturas en `test-results/`. Si ya tienes Chromium instalado en otra ruta, puedes indicar `BURGERSHOT_CHROMIUM=/ruta/al/binario npm run test:ui`.

Se verificaron las pantallas a 1440 px y 390 px de ancho. Las pruebas locales no sustituyen una comprobación con la configuración y los triggers adicionales que pueda tener la base de producción. No se aplicaron cambios a esa base ni se publicaron anuncios durante la verificación.
