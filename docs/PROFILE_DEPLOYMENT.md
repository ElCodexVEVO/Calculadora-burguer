# Fotografías y efectos · despliegue V7.7

Estado: código y pruebas locales listos. La revisión automática rechazó la ejecución remota sin aprobación explícita. **El parche y la función no se han aplicado a producción.** La interfaz explica este estado y conserva las operaciones del punto de venta.

Proyecto verificado por consulta de solo lectura: `kvcshkzmsbcllplebvpm` (BurgerShot). Antes del cambio: 185 ventas y 12 perfiles; `employee_appearance` no existe. Son cifras de control del 12 de octubre de 2026, no datos de demostración del frontend.

## Activación, después de aprobar

Desde la raíz del repositorio:

```powershell
supabase db query --linked --project-ref kvcshkzmsbcllplebvpm --file supabase_patch_v7_7_appearance.sql
supabase functions deploy profile-photo --project-ref kvcshkzmsbcllplebvpm --use-api --no-verify-jwt
```

La función verifica el JWT con `auth.getUser(token)` y comprueba que el perfil esté activo; no depende de la validación de JWT del gateway. `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY` son secretos predefinidos del entorno Edge, nunca se guardan en el cliente.

El parche añade una tabla, dos funciones y un bucket privado. No modifica perfiles, ventas, comisiones ni políticas existentes. No es necesario ejecutar los parches históricos otra vez. Es repetible; para desactivar temporalmente, retirar el despliegue frontend de esta rama conserva las fotos y las preferencias almacenadas. No borrar el bucket ni la tabla como parte de un rollback rutinario.

## Contrato de las fotos

- Entrada local JPG/PNG/WebP, máximo 5 MB. El navegador decodifica y permite recortar, ampliar y reposicionar, con controles de teclado. Resolución original máxima: 32 megapíxeles.
- Se exporta un JPEG de 512 × 512, calidad 86 %, sin transparencia, sobre crema; máximo 512 KB. El backend acepta únicamente este formato procesado, lo decodifica y recodifica a calidad 85 %, eliminando metadatos.
- Path generado por servidor: `store_id/user_id/UUID.jpg`; no se admite elegir cuenta, sucursal ni nombre de archivo desde el cliente. Las claves de servicio se usan solamente en Edge.
- `photo_version` protege cambios simultáneos. Un conflicto conserva la foto vigente y retira el nuevo archivo. El reemplazo confirmado retira el objeto anterior. Si falla la limpieza de Storage, el objeto anterior queda inaccesible por RLS y se registra `avatar_cleanup` para reintentar su eliminación por un administrador.
- Lectura privada para miembros activos de la misma sucursal; URLs firmadas duran 15 minutos y se renuevan mientras haya sesión. Una URL firmada es un enlace portador temporal; no se persiste como URL pública. Las referencias de interfaz se retiran al cerrar sesión.
- Las fotos personales tienen prioridad en los avatares compartidos. La foto histórica configurada por administración para Empleado de la semana se conserva como respaldo.
- Preferencias propias por `set_my_effects`; no se otorga permiso de escritura sobre `profiles` ni de subida directa a Storage.

## Comprobación real pendiente

Tras activar, comprobar con dos cuentas de prueba de sucursales distintas: guardar/recargar/cerrar sesión/abrir en otro dispositivo, reemplazar/eliminar, intentar subir un archivo malformado, intentar escribir una ruta ajena, intentar leer desde otra sucursal. Revisar los logs de Edge y que los conteos e importes financieros sigan intactos. Las pruebas actuales de Auth/Storage son simuladas; no acreditan un despliegue cloud realizado.

Referencias técnicas: [buckets privados y RLS](https://supabase.com/docs/guides/storage/buckets/fundamentals), [lectura y URLs firmadas](https://supabase.com/docs/guides/storage/serving/downloads).
