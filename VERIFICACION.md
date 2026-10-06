# Verificación — BurgerShot V5.5

## Resultado

- 30 escenarios de regresión del POS superados con JSDOM y Supabase simulado, incluyendo cantidades personalizadas y empleado de la semana.
- 17 escenarios de filtros, reportes, cortes e historial superados.
- 6 escenarios de cobro, edición completa e historial de clientes superados: Cliente / ID obligatorio; líneas y total recalculados; administrador y permisos específicos; agrupación de clientes; orden pagada protegida.
- 20 comprobaciones SQL superadas con PGlite/PostgreSQL local, incluyendo permisos finos RLS, aplicación repetible de V5.2/V5.3, RLS del historial, snapshots de cortes y bloqueo de órdenes pagadas.
- Revisión visual con Chromium 131: escritorio a 1440 px y móvil a 390 px sin desbordamiento horizontal, sin errores de página y con el logo WebP cargado.
- Integración Discord revisada: la URL solo se lee en `discord-notify`, las entregas usan clave única por tienda/evento y el frontend no bloquea el cobro si el webhook está ausente.

## V5.4.1

Se añadieron botones de cantidades rápidas, vista previa del importe, Enter para añadir, confirmación de cantidades grandes y plantillas de pedidos guardadas por cuenta y sucursal. `supabase_patch_v5_4_quantities.sql` amplía el historial de administradores para mostrar los productos y cantidades antes y después de una modificación.

## V5.5

Se añadió el panel **Empleado de la semana** al dashboard. La semana usa el horario local de lunes a domingo, excluye ventas anuladas y calcula ventas, generado, comisión, ticket promedio, actividad diaria y ranking. El administrador puede elegir un empleado activo y guardar una foto mediante URL pública o el bucket `employee-week`; RLS protege la configuración y las subidas.

Verificación específica de V5.5: 8 escenarios frontend (incluyendo persistencia, eliminación de foto, doble clic y cambio semanal), 9 pruebas SQL/RLS con Storage y Auth simulados, y revisión en Chromium a 1440, 1024 y 390 px sin desbordamiento horizontal. Se probó la optimización real de una imagen con canvas y el contrato de subida con Storage simulado. Falta aplicar y comprobar el parche y la subida contra tu Supabase real; no se accedió a tu cuenta.

## V5.2

Se añadió la edición completa de órdenes desde su detalle. Los usuarios con `can_edit_orders` pueden corregir cliente/ID, tipo, método, nota, productos y cantidades en órdenes activas aún no incluidas en un corte. El total, descuento, comisión y neto se recalculan; RLS y un trigger impiden alterar ventas ya pagadas.

Se añadieron seis permisos específicos (`can_edit_orders`, `can_manage_catalog`, `can_manage_employees`, `can_view_reports`, `can_manage_payouts`, `can_view_audit`) con políticas RLS y Edge Function actualizada. Los administradores conservan acceso total.

Se añadió el historial de clientes agrupado por Cliente / ID, con compras, convenios usados y detalle de órdenes. Empleados autorizados solo ven sus ventas; el administrador ve toda la tienda.

Se añadió el emblema BurgerShot WebP recreado desde la referencia recibida. Se usa en la marca, pantalla de acceso, sidebar, promoción y estado vacío de la orden actual. La imagen no reemplaza las fotografías individuales del menú.

## V5.3

Se añadió `supabase_patch_v5_3_discord.sql` y la Edge Function `discord-notify`. Envía embeds a Discord para ventas nuevas, ediciones, anulaciones y pagos/cortes, con permisos por tienda y actor. `discord_deliveries` registra el estado de cada entrega y evita duplicados de ventas/cortes. El secreto `DISCORD_WEBHOOK_URL` no se guarda en el repositorio ni en el navegador.

## V5.1

- Detalle de cada corte con ventas incluidas, productos, importe, comisión y neto.
- Snapshot de ventas al momento de registrar cada corte.
- Filtros por fecha, empleado, estado y rango personalizado.
- Totales, estadísticas y CSV basados en las filas filtradas.
- Paginación para tablas y lectura completa por páginas de API.
- Historial de cambios con RLS solo para administradores de la tienda, valores antes/después y texto escapado.

## Límites

El historial comienza después de ejecutar `supabase_patch_v5_1.sql`; los permisos quedan activos tras ejecutar `supabase_patch_v5_2.sql`. No inventa cambios anteriores. Operaciones realizadas con service role o SQL Editor aparecen como `Servicio / SQL de administración` porque el trigger no recibe un actor autenticado. No se guardan contraseñas, tokens ni correos. Los cambios de contraseña no forman parte del historial.

Las pruebas usan datos simulados y una instancia PostgreSQL local. No se ejecutaron escrituras en el proyecto Supabase real. Sigue `ACTUALIZAR_V5_1.md` para aplicar los parches y publicar los archivos.
