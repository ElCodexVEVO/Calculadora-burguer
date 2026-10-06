# Actualizar tu BurgerShot a V5.3

Tu app ya está conectada: conserva tu config.js actual. El config.js del ZIP está vacío porque es una plantilla.

## 1. Activar edición, permisos e historial de clientes

1. Abre tu proyecto actual en Supabase.
2. Entra en **SQL Editor → New query**.
3. Abre el archivo **supabase_patch_v5_2.sql** de este ZIP con el Bloc de notas.
4. Copia TODO su contenido, pégalo en la consulta y pulsa **Run**.
5. Si aparece `Success. No rows returned`, terminó correctamente.

Para esta actualización ejecuta **supabase_patch_v5_2.sql** después de tener V5.1 aplicado. No vuelvas a ejecutar V3, V4.1 o V4.2 y no reinicies la base de datos. El parche conserva tus ventas, empleados, convenios y cortes; se puede repetir sin borrar sus datos.

## 2. Subir los archivos de la página

En tu repositorio de GitHub, reemplaza o añade:

| Archivo | Dónde va |
| --- | --- |
| index.html | Raíz del repositorio, reemplaza el anterior |
| app.js | Raíz del repositorio, reemplaza el anterior |
| reports.css | Raíz del repositorio, reemplaza el anterior |
| assets/burgershot-logo.webp | Dentro de la carpeta assets, archivo nuevo |
| supabase_patch_v5_2.sql | Supabase SQL Editor, ejecutar una vez |

En GitHub usa **Add file → Upload files** y después **Commit changes**. Para el logo, entra primero en la carpeta **assets** y súbelo ahí. No pongas los archivos dentro de otra carpeta llamada burgershot en el repositorio: index.html debe seguir en la raíz.

Conserva los archivos styles.css, pos.css y la carpeta assets/food que ya funcionan. El ZIP completo también los incluye para una instalación completa.

**No reemplaces tu config.js configurado por el del ZIP.**

La edición completa de órdenes está incluida en esta versión. Reemplaza también `supabase/functions/employee-admin/index.ts` y vuelve a desplegar la función: ahora un empleado con permiso puede administrar accesos sin convertirse en administrador.

## 3. Activar el webhook de Discord (opcional, recomendado)

1. En **SQL Editor** ejecuta todo `supabase_patch_v5_3_discord.sql` después de V5.2. Crea solo la cola idempotente; no borra ventas ni cortes.
2. En Supabase despliega `supabase/functions/discord-notify/index.ts` como la función **discord-notify**.
3. En Discord abre **Editar canal → Integraciones → Webhooks → Nuevo webhook**, elige el canal de avisos y copia la URL.
4. En Supabase abre **Edge Functions → discord-notify → Secrets**. Puedes usar un canal único con `DISCORD_WEBHOOK_URL`, o separar los avisos con estos secretos:

```text
DISCORD_WEBHOOK_VENTA_URL=webhook del canal de ventas
DISCORD_WEBHOOK_ORDEN_URL=webhook del canal de órdenes editadas
DISCORD_WEBHOOK_ANULADA_URL=webhook del canal de anulaciones
DISCORD_WEBHOOK_PAGO_URL=webhook del canal de pagos/cortes
```

Cada URL se obtiene creando un webhook en el canal correspondiente de Discord. Si una URL específica falta, la función usa `DISCORD_WEBHOOK_URL` como respaldo. No pongas ninguna URL en el frontend ni en GitHub.
5. Sube el `app.js` del ZIP y publica. El POS llama a la función sin bloquear el cobro; si el secreto todavía no existe, solo queda un aviso en la consola.
6. Los cuatro logos vectoriales están en `assets/discord/`. Cuando GitHub Pages ya los publique, guarda también estas opciones en **Edge Functions → discord-notify → Secrets** para que cada evento use su propio avatar/miniatura:

```text
DISCORD_ICON_VENTA_URL=https://TU_USUARIO.github.io/TU_REPOSITORIO/assets/discord/venta.png
DISCORD_ICON_ORDEN_URL=https://TU_USUARIO.github.io/TU_REPOSITORIO/assets/discord/orden.png
DISCORD_ICON_ANULADA_URL=https://TU_USUARIO.github.io/TU_REPOSITORIO/assets/discord/anulada.png
DISCORD_ICON_PAGO_URL=https://TU_USUARIO.github.io/TU_REPOSITORIO/assets/discord/pago.png
```

Se envían cuatro eventos: venta registrada, orden editada, venta anulada y pago/corte de empleado. La tabla `discord_deliveries` evita duplicar ventas y cortes; las ediciones/anulaciones llevan un identificador de evento para que cada acción quede registrada.

## 4. Comprobar la actualización

Espera a que el despliegue más reciente de GitHub Pages en **Actions** termine correctamente. Abre tu web y pulsa **Ctrl + F5**.

- El logo junto a BurgerShot tiene el aro azul y las gotas rojas; debajo dice **POS · V5.3**.
- En Punto de venta, una orden vacía muestra el nuevo logo más grande.
- En **Todas las ventas**, abre una orden activa y pulsa **Editar orden** para corregir cliente, tipo, método de pago o nota. El Cliente / ID es obligatorio al cobrar. El botón no aparece para empleados, órdenes anuladas ni órdenes pagadas en un corte.
- La edición permite agregar/quitar productos y cambiar cantidades. Se recalculan subtotal, convenio, total, comisión y neto al guardar.
- En **Clientes**, consulta el historial agrupado por Cliente / ID, compras, convenios usados y detalle de cada orden. Un empleado con permiso de reportes ve sus propios clientes; el administrador ve la sucursal completa.
- En **Administración → Empleados**, el administrador asigna permisos específicos: editar órdenes, catálogo, empleados, reportes/clientes, pagos e historial. Supabase aplica los permisos también en el backend.
- En **Todas las ventas** aparecen los filtros de período, empleado y estado. **Exportar CSV** descarga todas las filas filtradas, aunque ocupen varias páginas.
- En **Pagos / cortes**, pulsa **Ver corte**. Puedes desplegar cada venta y exportar las ventas incluidas.
- Como administrador, verás **Historial de cambios**. Los cambios posteriores a instalar el parche aparecerán aquí; los cambios previos no se inventan ni se reconstruyen.
- Registra una venta de prueba y comprueba el embed **VENTA REGISTRADA** en Discord. Edita o anula una venta y registra un pago para comprobar **ORDEN ACTUALIZADA**, **VENTA ANULADA** y **CORTE REGISTRADO**.
- Para verificar el registro, puedes cambiar un precio y devolverlo a su valor anterior; ambas modificaciones mostrarán tu nombre y sus valores antes/después.

Los empleados siguen entrando con usuario y contraseña. No necesitan volver a configurar Supabase.

## Si algo no aparece

- **Falta activar permisos o historial:** ejecuta `supabase_patch_v5_2.sql` en el mismo proyecto al que apunta tu config.js y vuelve a iniciar sesión.
- **No aparece el permiso de empleados:** comprueba que desplegaste la Edge Function actualizada y que el perfil tiene `can_manage_employees = true`.
- **Logo no aparece:** comprueba que existe assets/burgershot-logo.webp en GitHub, con ese nombre exacto.
- **Se sigue viendo la versión anterior:** revisa el último despliegue de Actions y recarga con Ctrl + F5.
- **Corte anterior a V5.1:** es normal que se identifique como antiguo. Muestra sus ventas vinculadas actuales y conserva sus totales originales. Los cortes nuevos guardan una copia de las ventas al pagarlas.
- **No llega Discord:** confirma que `DISCORD_WEBHOOK_URL` está guardado como secreto de `discord-notify`, que desplegaste esa función y que ejecutaste V5.3. El cobro no depende del webhook.
- **Discord devuelve 401/404:** crea otro webhook y reemplaza el secreto; Discord invalida las URLs eliminadas.
