# Fotografías, efectos y redes · despliegue V7.8

Estado documental: 13 de octubre de 2026. **El backend está activado** en el proyecto Supabase `kvcshkzmsbcllplebvpm` (BurgerShot), después de la autorización explícita del usuario. Fotografías/efectos se activaron primero; `supabase_patch_v7_8_socials.sql` se aplicó después correctamente.

V7.7 ya está integrada en `main` mediante [PR #11](https://github.com/ElCodexVEVO/Calculadora-burguer/pull/11), merge `855d992160553cea82938f7b26b0620901645b04`. El frontend V7.8 sigue local en `codex/cinematic-profiles`, pendiente de un PR nuevo y de su integración/publicación. Activación de backend y publicación de frontend son estados separados.

## Artefactos activados

- `supabase_patch_v7_7_appearance.sql`: `employee_appearance`, RLS, funciones de preferencias/fotografía, publicación Realtime y bucket privado `employee-avatars`.
- `supabase/functions/profile-photo/index.ts`: Edge Function `profile-photo`. Verifica el JWT con `auth.getUser(token)` y comprueba perfil activo. La función se desplegó con validación de sesión propia, independiente del gateway.
- `supabase_patch_v7_8_socials.sql`: columna `social_links` y RPC `set_my_social_links(p_user_id, p_links)`. Está aplicado; no hay que repetir los parches históricos para esta instalación.

Los secretos de servicio pertenecen al entorno Edge. El navegador conserva únicamente la configuración pública necesaria para Supabase. No se modifican los permisos administrativos de `profiles` para habilitar estas funciones personales.

## Contrato fotográfico

- Entrada JPG/PNG/WebP hasta 5 MB y 32 megapíxeles. El navegador decodifica, recorta, amplía y reposiciona con controles de ratón y teclado.
- Exportación JPEG de 512 × 512, calidad 86 %, sobre crema, máximo 512 KB. El backend decodifica y recodifica a calidad 85 %, retirando metadatos.
- Path generado por servidor: `store_id/user_id/UUID.jpg`; el cliente no elige una cuenta, sucursal ni ruta ajena.
- `photo_version` protege cambios simultáneos. Un conflicto conserva la foto vigente y retira el objeto nuevo. Un reemplazo confirmado retira el anterior. Si falla la limpieza, el objeto anterior queda inaccesible por RLS y se registra `avatar_cleanup` para reintento administrativo.
- Lectura privada para miembros activos de la misma sucursal. URLs firmadas de 15 minutos, renovadas durante la sesión; no son URLs públicas persistentes y las referencias se retiran al salir.
- Fotos personales con prioridad en avatares compartidos; la foto histórica configurada para Empleado de la semana se conserva como respaldo.
- `set_my_effects` permite guardar solo la preferencia propia. No se concede subida directa a Storage ni escritura general sobre fotos desde el cliente.

## Contrato de redes

Instagram, Discord, TikTok y Twitch son opcionales. La interfaz normaliza identificadores y enlaces HTTPS de dominios admitidos; el servidor valida los identificadores recibidos. No realiza OAuth, no conecta sesiones de esas plataformas ni envía mensajes.

La RPC exige una sesión activa y `p_user_id = auth.uid()`, incluso para administradores. Solo permite las cuatro claves reconocidas y valores de texto con formato/longitud admitidos. Campos vacíos eliminan esa red. Actualiza únicamente `social_links` y la marca temporal, conservando fotografía, versión y nivel de efectos. El rol anónimo no tiene permiso de ejecución.

Instagram admite hasta 30 caracteres, TikTok 24 y Twitch 25. Discord admite el identificador actual o la forma histórica con discriminador. Instagram, TikTok y Twitch se muestran como enlaces seguros; Discord permite copiar el usuario.

## Evidencia cloud real

El despliegue inicial de fotos/efectos conservó entonces 187 ventas y 12 perfiles, con totales financieros idénticos. Se comprobaron RLS, permisos, Realtime, bucket privado y límites. La API desplegada respondió OPTIONS 200; POST sin sesión y DELETE con JWT inválido respondieron 401. La preferencia propia se guardó/leyó en una transacción revertida.

Para la activación de redes, las huellas antes/después fueron idénticas para **198 ventas, 12 perfiles y 6 cortes**. Se comparó la huella de los registros completos de estas tablas y la de los valores previos de `user_id`, `store_id`, `photo_path`, `photo_version` y `effects_mode` en apariencia. La diferencia de ventas respecto al corte anterior no se atribuye al parche.

La verificación de redes ejecutó la RPC bajo rol authenticated en una transacción real. Confirmó lectura de los valores propios, rechazo de otro usuario y de un identificador inseguro. Se comprobó ejecución para authenticated y denegación para anon. La transacción terminó con `ROLLBACK`; no se conservaron valores QA ni se alteraron fotos o efectos.

## Pendiente y recuperación

No se ejecutó el ciclo fotográfico autenticado real ni la sincronización en dos dispositivos. Con sesiones de prueba reales falta comprobar guardar/recargar/salir/entrar desde otro dispositivo, reemplazar/eliminar y los errores de ruta o archivo en ese flujo. Las pruebas completas actuales de procesamiento y Storage usan servicios simulados. La RPC de redes tiene evidencia cloud real; su flujo entre dispositivos no se ha probado.

No se crearon usuarios ni se restablecieron contraseñas para realizar estas comprobaciones. No se subieron fotografías de empleados. La suite final de frontend/SQL/API supera 182 escenarios; su alcance está en [CINEMATIC_QA.md](CINEMATIC_QA.md).

Para revertir temporalmente el frontend, mantener la versión de `main` conserva las preferencias y fotos almacenadas. No borrar bucket ni tabla en una recuperación rutinaria. La revisión completa de la nueva referencia pidió dos ajustes de interfaz, ya resueltos. Su confirmación final fue `disposition: ship` dentro de ese alcance; no acredita el ciclo fotográfico real pendiente.
